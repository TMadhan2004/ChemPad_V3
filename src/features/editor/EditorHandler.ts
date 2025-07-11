import { EntityLifeStage, EntityType, EntityVisualState } from "@constants/enum.constants";
import { actions } from "@features/chemistry/chemistrySlice";
import { EntitiesMapsStorage } from "@features/shared/storage";
import { Atom, Bond, Entity } from "@src/entities";
import { ChemistryState, EntityEventContext, EntityEventsFunctions } from "@src/types";
import _ from "lodash";
import { getMolObject, getChemDocument, resetChemDocument, exportFileFromMolecule, setMolObject } from "@src/utils/KekuleUtils";

interface EntityMaps {
    selected: Map<number, Entity>;
    map: Map<number, Entity>;
}

declare global {
  interface Window {
    Kekule: any;
    MOL?: any;
    setMolObject?: (mol: any) => void;
  }
}

export class EditorHandler {
    dispatch: any;

    atomsMap: Map<number, Atom>;

    bondsMap: Map<number, Bond>;

    selectedAtoms: Map<number, Atom>;

    selectedBonds: Map<number, Bond>;

    hovered?: Entity | Atom | Bond;

    anchor?: Entity | Atom | Bond;

    private _copied!: ChemistryState;

    public get copied(): ChemistryState {
        //  return a shallow copy of the object
        return _.cloneDeep(this._copied);
    }

    public set copied(value: ChemistryState) {
        this._copied = value;
    }

    constructor(dispatch?: any) {
        this.dispatch = dispatch;
        this.atomsMap = EntitiesMapsStorage.atomsMap;
        this.bondsMap = EntitiesMapsStorage.bondsMap;
        this.selectedAtoms = new Map<number, Atom>();
        this.selectedBonds = new Map<number, Bond>();
        this.copied = {};
    }

    getBoundingBox() {
        const { atomsTree } = EntitiesMapsStorage;
        // @ts-ignore
        const { data: atomTreeData } = atomsTree;
        return {
            minX: atomTreeData?.minX ?? 0,
            minY: atomTreeData?.minY ?? 0,
            maxX: atomTreeData?.maxX ?? 0,
            maxY: atomTreeData?.maxY ?? 0,
        };
    }

    setDispatch(dispatch: any) {
        this.dispatch = dispatch;
    }

    private createFullStateObject() {
        const result: ChemistryState = {
            atoms: [],
            bonds: [],
        };
        this.atomsMap.forEach((atom, id) => {
            result.atoms!.push({
                id,
                attributes: atom.getAttributes(),
            });
        });
        this.bondsMap.forEach((bond, id) => {
            result.bonds!.push({
                id,
                attributes: bond.getAttributes(),
            });
        });

        return result;
    }

    clear() {
        let changed = 0;
        this.atomsMap.forEach((atom) => {
            atom.destroy([], false);
            changed += 1;
        });
        this.bondsMap.forEach((bond) => {
            bond.destroy([], false);
            changed += 1;
        });
        this.hovered = undefined;

        return changed;
    }

    createHistoryUpdate() {
        const currentState = this.createFullStateObject();
        this.dispatch(actions.update_history_state(currentState));
    }

    editAtomsAndBondsBasedOnStateObject(state: ChemistryState) {
        // let start = performance.now();

        const stateAtomsIds = new Set<number>();
        const stateBondsIds = new Set<number>();

        const ignoreBondsIds = state.bonds?.map((bond) => bond.id);

        state.atoms?.forEach((atom) => {
            stateAtomsIds.add(atom.id);
            if (this.atomsMap.has(atom.id)) {
                const entity = this.atomsMap.get(atom.id);
                entity?.updateAttributes(atom.attributes, ignoreBondsIds);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const entity = new Atom({
                    props: atom.attributes,
                });
            }
        });

        // const end2 = performance.now();
        // console.log(`editAtomsAndBondsBasedOnStateObject A took ${end2 - start} ms`);
        // start = performance.now();

        state.bonds?.forEach((bond) => {
            stateBondsIds.add(bond.id);
            if (this.bondsMap.has(bond.id)) {
                const entity = this.bondsMap.get(bond.id);
                entity?.updateAttributes(bond.attributes);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                const entity = new Bond({
                    props: bond.attributes,
                });
            }
        });

        this.atomsMap.forEach((atom, id) => {
            if (!stateAtomsIds.has(id)) {
                atom.destroy([], false);
            }
            atom.execOuterDrawCommand();
        });

        this.bondsMap.forEach((bond, id) => {
            if (!stateBondsIds.has(id)) {
                bond.destroy([], false);
            }
            bond.execOuterDrawCommand();
        });

        // const end = performance.now();
        // console.log(`editAtomsAndBondsBasedOnStateObject took ${end - start} ms`);
    }

    setEventListenersForAtoms(event?: EntityEventsFunctions) {
        this.atomsMap.forEach((atom) => {
            atom.setListeners(event);
        });
    }

    isEmpty() {
        return this.atomsMap.size === 0 && this.bondsMap.size === 0;
    }

    updateAllKekuleNodes() {
        this.atomsMap.forEach((atom) => {
            atom.updateKekuleNode();
        });

        this.bondsMap.forEach((bond) => {
            bond.updateKekuleNode();
        });
    }

    /**
     * Syncs the current drawing to the global MOL, matching classic export logic.
     */
    syncToGlobalMOL() {
        // Safely reset ChemDocument and MOL
        resetChemDocument();
        // Explicitly remove all children from ChemDocument, then create a new Kekule.Molecule and append
        const chemDoc = getChemDocument();
        while (chemDoc.getChildCount() > 0) {
            chemDoc.removeChild(chemDoc.getChildAt(0));
        }
        const MOL = new window.Kekule.Molecule();
        chemDoc.appendChild(MOL);
        // Set the global MOL reference for export logic
        setMolObject(MOL);

        // --- Build Kekule molecule from scratch ---
        const atomIdToKekuleAtom: Record<number, any> = {};
        // 1. Create and append new Kekule.Atom objects
        this.atomsMap.forEach((atom) => {
            // All atom properties are on atom.attributes
            const attr = atom.attributes;
            const kekuleAtom = new window.Kekule.Atom();
            if (attr.symbol) kekuleAtom.setSymbol(attr.symbol);
            if (typeof attr.charge === 'number') kekuleAtom.setCharge(attr.charge);
            if (attr.center && typeof attr.center.x === 'number' && typeof attr.center.y === 'number') {
                kekuleAtom.setCoord2D({ x: attr.center.x, y: attr.center.y });
            }
            atomIdToKekuleAtom[attr.id] = kekuleAtom;
            MOL.appendNode(kekuleAtom);
        });
        // Debug: Log MOL nodes and mapping after all atoms appended
        console.log('[DEBUG] After atom append, MOL.getNodes():', MOL.getNodes());
        console.log('[DEBUG] atomIdToKekuleAtom mapping:', atomIdToKekuleAtom);
        // Strict identity check: is every atom in the mapping present in MOL.getNodes()?
        const molNodes = MOL.getNodes();
        Object.entries(atomIdToKekuleAtom).forEach(([id, atom]) => {
            const found = molNodes.includes(atom);
            console.log(`[DEBUG] Atom id ${id} in MOL.getNodes():`, found, atom);
        });
        if (molNodes.length > 0) {
            console.log('[DEBUG] window.Kekule.Atom === MOL.getNodes()[0].constructor:', window.Kekule.Atom === molNodes[0].constructor);
        }

        // 2. Create and append new Kekule.Bond objects
        this.bondsMap.forEach((bond) => {
            const attr = bond.attributes;
            const beginAtom = atomIdToKekuleAtom[attr.atomStartId];
            const endAtom = atomIdToKekuleAtom[attr.atomEndId];
            console.log('[DEBUG] Bond attributes:', attr);
            console.log('[DEBUG] atomIdToKekuleAtom mapping:', atomIdToKekuleAtom);
            if (!beginAtom || !endAtom) {
                console.warn('[WARN] Bond skipped: beginAtom or endAtom not found for bond', attr, beginAtom, endAtom);
                return;
            }
            // Create bond and append to molecule BEFORE setting connected objects
            const kekuleBond = new window.Kekule.Bond();
            try {
                MOL.appendConnector(kekuleBond);
                kekuleBond.setConnectedObjs([beginAtom, endAtom]);
                if (typeof attr.order === 'number') kekuleBond.setBondOrder(attr.order);
            } catch (e) {
                console.error('[ERROR] Failed to create Kekule.Bond:', e, attr, beginAtom, endAtom);
            }
        });

        // Debug log
        const chemDocument = getChemDocument();
        console.log('[DEBUG] chemDocument children count:', chemDocument.getChildCount());
        console.log('[DEBUG] chemDocument children:', chemDocument.getChildren());
        console.log('[DEBUG] New MOL node count:', MOL.getNodeCount());
        console.log('[DEBUG] New MOL connector count:', MOL.getConnectorCount());
        // If Kekule requires finalize, call it
        if (typeof MOL.finalize === 'function') {
            MOL.finalize();
            console.log('[DEBUG] MOL.finalize() called');
        }
    }

    /**
     * Returns a Kekule.Molecule object representing the current drawing.
     * This is used for export to SMILES and other formats.
     */
    getKekuleMolecule() {
        // @ts-ignore Kekule is global
        const mol = new Kekule.Molecule();
        // Add atoms
        this.atomsMap.forEach((atom) => {
            if (atom.nodeObj) {
                mol.appendNode(atom.nodeObj);
            }
        });
        // Add bonds
        this.bondsMap.forEach((bond) => {
            if (bond.connectorObj) {
                mol.appendConnector(bond.connectorObj);
            }
        });
        return mol;
    }

    private isHovered() {
        return this.hovered?.visualState === EntityVisualState.Hover;
    }

    getHoveredAtom(): Atom | undefined {
        const candidate = this.hovered;
        if (candidate && candidate.myType === EntityType.Atom) {
            // temporal hack - since we cant import Atom and use instance of
            if (this.isHovered()) {
                const resultCandidate = candidate as Atom;
                if (resultCandidate.getLifeStage() > EntityLifeStage.Initialized) {
                    this.hovered = undefined;
                    return undefined;
                }
                return resultCandidate;
            }
        }
        return undefined;
    }

    getHoveredBond(): Bond | undefined {
        const candidate = this.hovered;
        if (candidate && candidate.myType === EntityType.Bond) {
            // temporal hack - since we cant import Atom and use instance of
            if (this.isHovered()) {
                const resultCandidate = candidate as Bond;
                if (resultCandidate.getLifeStage() > EntityLifeStage.Initialized) {
                    this.hovered = undefined;
                    return undefined;
                }
                return resultCandidate;
            }
        }
        return undefined;
    }

    setEventListenersForBonds(event?: EntityEventsFunctions) {
        this.bondsMap.forEach((bond) => {
            bond.setListeners(event);
        });
    }

    updateCopiedContents() {
        const copiedAtoms = new Map(this.selectedAtoms);
        const copiedBonds = new Map(this.selectedBonds);
        // make sure both start and end atoms of bonds are copied
        copiedBonds.forEach((bond) => {
            const { startAtom } = bond;
            const { endAtom } = bond;
            if (startAtom && !copiedAtoms.has(startAtom.getId())) {
                copiedAtoms.set(startAtom.getId(), startAtom);
            }
            if (endAtom && !copiedAtoms.has(endAtom.getId())) {
                copiedAtoms.set(endAtom.getId(), endAtom);
            }
        });

        // copiedBonds: Map<number, Bond>
        const result: ChemistryState = {
            atoms: [],
            bonds: [],
        };
        copiedAtoms.forEach((atom, id) => {
            result.atoms!.push({
                id,
                attributes: atom.getAttributes(),
            });
        });
        copiedBonds.forEach((bond, id) => {
            result.bonds!.push({
                id,
                attributes: bond.getAttributes(),
            });
        });

        this.copied = result;
    }

    resetCopiedContents() {
        this.copied = {};
    }

    getMaps(type: EntityType): EntityMaps {
        switch (type) {
            case EntityType.Atom:
                return {
                    selected: this.selectedAtoms,
                    map: this.atomsMap,
                };
            default:
                return {
                    selected: this.selectedBonds,
                    map: this.bondsMap,
                };
        }
    }

    setHoverModeForEntities(mode: boolean, color?: string) {
        if (mode) {
            this.hovered?.setVisualState(EntityVisualState.Hover, color);
        } else if (this.isHovered()) {
            this.hovered?.setVisualState(EntityVisualState.None, color);
        }

        if (!mode) {
            this.hovered = undefined;
        }
    }

    applyFunctionToAtoms(func: (atom: Atom) => void, onlySelected: boolean) {
        const map = onlySelected ? this.selectedAtoms : this.atomsMap;
        map.forEach((entity) => {
            func(entity);
        });
        return map.size;
    }

    applyFunctionToBonds(func: (bond: Bond) => void, onlySelected: boolean) {
        const map = onlySelected ? this.selectedBonds : this.bondsMap;
        map.forEach((entity) => {
            func(entity);
        });
        return map.size;
    }

    resetSelectedAtoms() {
        this.applyFunctionToAtoms((atom) => {
            atom.setVisualState(EntityVisualState.None);
        }, false);
        this.selectedAtoms.clear();
    }

    resetSelectedBonds() {
        this.applyFunctionToBonds((bond) => {
            bond.setVisualState(EntityVisualState.None);
        }, false);
        this.selectedBonds.clear();
    }

    addAtomToSelected(atom: Atom, color?: string) {
        this.selectedAtoms.set(atom.getId(), atom);
        atom.setVisualState(EntityVisualState.Select, color);
    }

    addBondToSelected(bond: Bond, color?: string) {
        this.selectedBonds.set(bond.getId(), bond);
        bond.setVisualState(EntityVisualState.Select, color);
    }

    setHoverModeForAtoms(mode: boolean) {
        this.setHoverModeForEntities(mode);
    }

    setHoverModeForBonds(mode: boolean) {
        this.setHoverModeForEntities(mode);
    }

    setHoverMode(mode: boolean, atoms: boolean, bonds: boolean, color?: string) {
        this.setEventListenersForAtoms();
        this.setEventListenersForBonds();

        if (!mode) {
            // ???? should delete previous?
            if (atoms) this.setHoverModeForEntities(false);
            if (bonds) this.setHoverModeForEntities(false);
            this.hovered = undefined;
            return;
        }

        const hoverHandler: EntityEventsFunctions = {
            onMouseEnter: (e: Event, data: EntityEventContext) => {
                const { id, type } = data;
                const maps = this.getMaps(type);
                const entity = maps.map.get(id);
                if (!entity || (this.hovered === entity && this.isHovered()) || maps.selected.has(id)) {
                    this.anchor = entity;
                    return;
                }
                if (this.hovered) this.setHoverModeForEntities(false, color);
                this.hovered = entity;
                this.anchor = this.hovered;
                this.setHoverModeForEntities(true, color);
            },
            onMouseLeave: (e: Event, data: EntityEventContext) => {
                const { id, type } = data;
                const maps = this.getMaps(type);
                const entity: Entity | undefined = maps.map.get(id);
                if (!entity || maps.selected.has(id)) {
                    this.anchor = undefined;
                    return;
                }
                this.setHoverModeForEntities(false, color);
                entity.setVisualState(EntityVisualState.None, color);
                this.hovered = undefined;
                this.anchor = this.hovered;
            },
        };

        if (atoms) {
            this.setEventListenersForAtoms(hoverHandler);
        }
        if (bonds) {
            this.setEventListenersForBonds(hoverHandler);
        }
    }

    drawAll() {
        this.atomsMap.forEach((atom) => {
            atom.execOuterDrawCommand();
        });
        // !!! also for bonds
    }

    /**
     * Syncs the molecule and exports SMILES using the existing export utilities.
     * This ensures the global MOL is up to date and export logic is reused.
     */
    public exportSmiles(): string {
        this.updateAllKekuleNodes();
        this.syncToGlobalMOL();
        // Debug: log molecule state before export
        const MOL = window.MOL;
        console.log('[DEBUG] [exportSmiles] MOL node count:', MOL?.getNodeCount && MOL.getNodeCount());
        console.log('[DEBUG] [exportSmiles] MOL connector count:', MOL?.getConnectorCount && MOL.getConnectorCount());
        // Use direct import (already imported at top)
        const smiles = exportFileFromMolecule("smiles");
        console.log('[DEBUG] [exportSmiles] Exported SMILES:', smiles);
        return smiles;
    }
}

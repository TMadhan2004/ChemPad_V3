/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-plusplus */
/* eslint-disable no-undef */
import { EditorConstants } from "@constants/editor.constant";
import { BondOrder } from "@constants/enum.constants";
import { EntitiesMapsStorage } from "@features/shared/storage";
import _ from "lodash";

// Kekule.js is imported in ./public/index.html
export function getSmiles() {
    try {
        const mol = getMolObject();
        if (!mol) return '';
        return Kekule.IO.saveFormatData(mol, 'smi');
    } catch (e) {
        console.error('Error generating SMILES:', e);
        return '';
    }
}

export function resetChemDocument() {
    chemDocument = new Kekule.ChemDocument(1);
    MOL = new Kekule.Molecule();
    chemDocument.appendChild(MOL);
}
let chemDocument = new Kekule.ChemDocument(1);
let MOL = new Kekule.Molecule();
chemDocument.appendChild(MOL);

export function setMolObject(mol) {
    MOL = mol;
    window.MOL = mol;
}


export function getChemDocument() {
    return chemDocument;
}

export function getMolObject() {
    return MOL;
}

export function getFileFormatsOptions(rawKekuleFormats) {
    // Example for rawKekuleFormat
    // {
    //     "id": "sd",
    //     "mimeType": "chemical/x-mdl-sdfile",
    //     "fileExts": [
    //         "sd",
    //         "sdf"
    //     ],
    //     "dataType": "text",
    //     "title": "MDL Structure-Data format"
    // }

    // result:
    // <option value="sd" title="chemical/x-mdl-sdfile">MDL Structure-Data format (*.sd, *.sdf)</option> //
    const result = [];
    rawKekuleFormats.forEach((formatRaw) => {
        if (!formatRaw.id || !(formatRaw.fileExts && formatRaw.fileExts.length > 0)) {
            console.error("Non supported file", formatRaw);
            return;
        }

        let extensionString = "";
        formatRaw.fileExts.forEach((ext) => {
            if (extensionString) {
                extensionString += ", ";
            }
            extensionString = `${extensionString}*.${ext}`;
        });

        const format = {
            value: formatRaw.id,
            title: formatRaw.mimeType ?? formatRaw.id,
            name: `${formatRaw.title ?? formatRaw.mimeType ?? formatRaw.id} (${extensionString})`,
        };
        result.push(format);
    });
    return result;
}

export function getKekule() {
    return Kekule;
}

function calculateCoordIfNeeded(srcMol, format = "") {
    // Check for both 2D and 3D coordinates
    const has2D = srcMol.nodesHasCoordOfMode(Kekule.CoordMode.COORD2D, true, true);
    const has3D = srcMol.nodesHasCoordOfMode(Kekule.CoordMode.COORD3D, true, true);
    if (has2D || has3D) {
        return srcMol;
    }
    let targetMol = srcMol;
    const dimension = 2;
    const serviceName = dimension === 2 ? Kekule.Calculator.Services.GEN2D : Kekule.Calculator.Services.GEN3D;
    try {
        Kekule.Calculator.generateStructure(
            srcMol,
            serviceName,
            { sync: true, modifySource: true },
            (generatedMol) => {
                targetMol = generatedMol;
                console.log("[KekuleUtils] 2D coordinates generated.", generatedMol);
            },
            (err) => {
                console.warn("[KekuleUtils] Error generating coordinates:", err);
                targetMol = srcMol;
            },
            (msgData) => {
                console.log("[KekuleUtils] Generator message:", msgData);
                targetMol = srcMol;
            }
        );
    } catch (e) {
        console.warn("[KekuleUtils] Exception during coordinate generation:", e);
        targetMol = srcMol;
    }
    return targetMol;
}

export function importMoleculeFromFile(file, format) {
    try {
        resetChemDocument();
        let fmt = format ? format.toLowerCase() : '';
        let content = file;
        // Handle SMILES special case
        if (fmt === 'smiles' || fmt === 'smi') {
            fmt = 'smi'; // always use 'smi' for Kekule
            // Clean up the SMILES string (remove whitespace, newlines)
            if (typeof content === 'string') {
                content = content.trim();
            }
        }
        let fileMol;
        try {
            fileMol = Kekule.IO.loadFormatData(content, fmt);
        } catch (err1) {
            // Fallback: if the format was 'smiles', try 'smi' or vice versa
            if (fmt === 'smiles') {
                try {
                    fileMol = Kekule.IO.loadFormatData(content, 'smi');
                } catch (err2) {
                    console.error('[KekuleUtils] Both "smiles" and "smi" formats failed:', err2);
                    throw err2;
                }
            } else if (fmt === 'smi') {
                try {
                    fileMol = Kekule.IO.loadFormatData(content, 'smiles');
                } catch (err2) {
                    console.error('[KekuleUtils] Both "smi" and "smiles" formats failed:', err2);
                    throw err2;
                }
            } else {
                throw err1;
            }
        }
        fileMol = calculateCoordIfNeeded(fileMol, fmt);
        // Debug: log coordinates
        const has2D = fileMol.nodesHasCoordOfMode(Kekule.CoordMode.COORD2D, true, true);
        const has3D = fileMol.nodesHasCoordOfMode(Kekule.CoordMode.COORD3D, true, true);
        if (!has2D && !has3D) {
            console.warn("[KekuleUtils] Molecule has no coordinates after import. Rendering may fail.", fileMol);
        } else {
            console.log("[KekuleUtils] Molecule coordinates present after import.", { has2D, has3D });
        }
        MOL = fileMol;
        chemDocument.appendChild(fileMol);
        return fileMol;
    } catch (error) {
        console.error("[KekuleUtils] importMoleculeFromFile error:", error);
        return undefined;
    }
}

function getBoundingBox(molec) {
    // {x2: maxX, x1: minX, y2: maxY, y1: minY}
    let box = molec.getContainerBox2D();
    if (!box || !box.minX || !box.minY || !box.maxX || !box.maxY) box = molec.getContainerBox3D();
    const { x1: minX, y1: minY, x2: maxX, y2: maxY } = box;
    const xDelta = maxX - minX;
    const yDelta = maxY - minY;
    return { minX, minY, maxX, maxY, xDelta, yDelta };
}

function transformMoleculeBoundingBox(chemDoc) {
    if (chemDoc.getChildren().length === 0) return;
    const molec = chemDoc.getChildren()[0];
    const bbox = getBoundingBox(molec);
    const targetBoundingBox = { minX: 0, minY: 0, width: 10 };

    // const scale = targetBoundingBox.width / bbox.xDelta;
    const scale = 1 / EditorConstants.Scale;

    // transfer all points from bbox to targetBoundingBox
    for (let i = 0, l = MOL.getNodeCount(); i < l; i += 1) {
        const node = MOL.getNodeAt(i);
        const { x, y } = _.isEmpty(node.absCoord2D) ? node.absCoord3D : node.absCoord2D;
        const newX = (x - bbox.minX) * scale + targetBoundingBox.minX;
        const newY = -(y - bbox.maxY) * scale + targetBoundingBox.minY;
        node.setCoord2D({ x: newX, y: newY });
    }
}

export function exportFileFromMolecule(format, molecule) {
    try {
        const molToExport = molecule || MOL;
        if (!molToExport || molToExport.getNodeCount() === 0) {
            console.error("[KekuleUtils] exportFileFromMolecule: Molecule is empty.");
            return "";
        }
        try {
            const currentTime = new Date();
            molToExport.setName("molecule");
            molToExport.setInfoValue("author", "__");
            molToExport.setInfoValue("generator", "SketChem");
            molToExport.setInfoValue("date", currentTime);
            molToExport.setInfoValue("comment", `Generated by SketChem ${currentTime.toISOString()}`);
        } catch (error) {
            console.error(error);
        }
        const data = Kekule.IO.saveFormatData(molToExport, format);
        return data;
    } catch (error) {
        console.error(error);
        return "";
    }
}

export function enableBabel() {
    if (Kekule.OpenBabel.isScriptLoaded() === true) return;
    Kekule.OpenBabel.enable(); // .enableOpenBabelFormats();
    //  ! should take a few seconds, may be check if the following is true and create a callback:
}

export function enableIndigo() {
    if (Kekule.Indigo.isScriptLoaded() === true) return;
    Kekule.Indigo.enable();
}

export function getSupportedReadFormatsOptions() {
    const formats = Kekule.IO.ChemDataReaderManager.getAllReadableFormats();
    return getFileFormatsOptions(formats);
}

export function getSupportedReadFormats() {
    const formats = Kekule.IO.ChemDataReaderManager.getAllReadableFormats();
    // join all formats by comma
    return formats.map((format) => format.id).join(", ");
}

export function getSupportedWriteFormats() {
    const formats = Kekule.IO.ChemDataWriterManager.getAllWritableFormats();
    return getFileFormatsOptions(formats);
}

export function getLinkedBonds(node) {
    return node.getLinkedBonds();
}

/**
 * Returns list of neighbors ids of a node
 * @param {Kekule.ChemStructureNode} node
 * @return {Set<Number>}
 */
export function getAtomNeighborsIds(node) {
    if (!node || !(node instanceof Kekule.ChemStructureNode))
        throw new Error(`getAtomNeighbors: atom:${node} is not a Kekule.ChemStructureNode`);
    const result = new Set();
    node.getLinkedChemNodes().forEach((neighbor) => {
        if (neighbor instanceof Kekule.ChemStructureNode) {
            result.add(neighbor.id);
        }
    });

    return result;
}

/**
 * Returns list of neighbors of a node
 * @param {Kekule.ChemStructureNode} atom
 * @return {Set<Atom>}
 */
export function getAtomNeighbors(atom) {
    neighborsIds = getAtomNeighborsIds(atom);

    const result = new Set();
    neighborsIds.forEach((neighborId) => {
        if (neighbor instanceof Kekule.ChemStructureNode) {
            const neighborObj = EntitiesMapsStorage.getAtomById(neighborId);
            result.add(neighborObj);
        }
    });

    return result;
}

export function isAtom(bond) {
    return node.getLinkedBonds();
}

export function destroy(item) {
    return item.finalize();
}

export function getNumericId(id) {
    switch (typeof id) {
        case "string": {
            const result = parseInt(id.match(/[0-9]+$/)[0], 10);
            if (Number.isNaN(result)) {
                throw new Error(`Id type unknown ${id}`);
            }
            return result;
        }
        case "number":
            return id;
        default:
            throw new Error(`Id type unknown ${id}`);
    }
}

/**
 * Operation of merging two structure fragment as one.
 * @class
 * @augments Kekule.ChemObjOperation.Base
 *
 * @param {Kekule.StructureFragment} target Source fragment.
 * @param {Kekule.StructureFragment} dest Destination fragment.
 *
 * @property {Kekule.StructureFragment} target Source fragment, all connectors and nodes will be moved to dest fragment.
 * @property {Kekule.StructureFragment} dest Destination fragment.
 * @property {Array} mergedNodes Nodes moved from target to dest during merging.
 * @property {Array} mergedConnectors Connectors moved from target to dest during merging.
 */
export function MergeStructFragment(target, dest) {
    const b1 = chemDocument.getChildren();
    console.log("Children", b1);
    // not available without widget
    // const operation = new Kekule.ChemStructOperation.MergeStructFragment(target, dest);

    let mergedNodes;
    let mergedConnectors;
    if (target && dest) {
        const nodes = Kekule.ArrayUtils.clone(target.getNodes());
        mergedNodes = nodes;
        const connectors = Kekule.ArrayUtils.clone(target.getConnectors());
        mergedConnectors = connectors;

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        Kekule_StructureFragment_moveChildBetweenStructFragment(target, dest, nodes, connectors);
        const parent = target.getParent();
        if (parent) {
            // remove target from parent
            // doesn't work as well
            // let removeOperation = new Kekule.ChemObjOperation.Remove(target, parent, null, this.getEditor());
            parent.removeChild(target);
        }
    }

    const b = chemDocument.getChildren();
    console.log("Children", b);
}

export function registerAtomFromAttributes(attributes) {
    // AtomAttributes:
    // id: number;
    // center: Vector2;
    // charge: number;
    // symbol: string;
    // color: string;
    const atom = new Kekule.Atom();
    MOL.appendNode(atom);

    atom.id = attributes.id;
    const { symbol, charge, center } = attributes;
    atom.setSymbol(symbol);
    atom.setCharge(charge);
    atom.setCoord2D(center);

    return atom;
}

export function registerBondFromAttributes(attributes) {
    // id: number;
    // type: BondOrder;
    // stereo: BondStereoKekule;
    // atomStartId: number;
    // atomEndId: number;
    const { id, order, stereo, atomStartId, atomEndId } = attributes;

    const startAtom = EntitiesMapsStorage.getAtomById(atomStartId).getKekuleNode();
    const endAtom = EntitiesMapsStorage.getAtomById(atomEndId).getKekuleNode();

    const bond = new Kekule.Bond();
    MOL.appendConnector(bond);

    bond.setId(id);
    bond.setBondOrder(order);
    bond.setConnectedObjs([startAtom, endAtom]);
    bond.setStereo(stereo);

    return bond;
}

export function getImplicitHydrogensCount(atom) {
    const count = atom.getImplicitHydrogenCount();
    if (Number.isNaN(count)) {
        return 0;
    }
    return count;
}

export function getImplicitValence(atom) {
    const count = atom.getImplicitValence();
    if (Number.isNaN(count)) {
        return 0;
    }
    return count;
}

// try catch wrapper for functions with arguments that can throw an error
function tryCatchWrapper(func, ...args) {
    try {
        return func(...args);
    } catch (error) {
        console.error(`Kekule error: ${error}`);
        return undefined;
    }
}

export function getAtomConnectorsList(atom) {
    return tryCatchWrapper(() => {
        const result = [];
        atom.getLinkedConnectors().forEach((connector) => {
            if (connector instanceof Kekule.ChemStructureConnector) {
                result.push(connector);
            }
        });

        return result;
    });
}

export function isHydrogenBond(bond) {
    return tryCatchWrapper(() => {
        if (!bond || !(bond instanceof Kekule.ChemStructureConnector)) return false;
        let isHydrogenBondFlag = false;
        bond.getConnectedObjs().forEach((node) => {
            if (node instanceof Kekule.ChemStructureNode) {
                if (node.isHydrogenAtom()) isHydrogenBondFlag = true;
            }
        });
        return isHydrogenBondFlag;
    });
}

export function getAtomConnectorsObjectWithHydrogenData(atom) {
    return tryCatchWrapper(() => {
        const result = {
            hydrogensBonds: [],
            nonHydrogensBonds: [],
        };
        getAtomConnectorsList(atom).forEach((connector) => {
            if (connector instanceof Kekule.ChemStructureConnector) {
                if (isHydrogenBond(connector)) {
                    result.hydrogensBonds.push(connector);
                    return;
                }
                result.nonHydrogensBonds.push(connector);
            }
        });

        return result;
    });
}

export function getAtomConnectorsObject(atom) {
    return tryCatchWrapper(() => {
        const result = [];
        getAtomConnectorsList(atom).forEach((connector) => {
            if (connector instanceof Kekule.ChemStructureConnector) {
                result.push(connector);
            }
        });

        return result;
    });
}

// calculate sum of bond orders based on bond order enum
export function getBondOrderSum(bonds) {
    return bonds.reduce((acc, bond) => {
        if (!(bond instanceof Kekule.ChemStructureConnector)) return acc;

        switch (bond.getBondOrder()) {
            case Kekule.BondOrder.COVALENT:
            case Kekule.BondOrder.SINGLE:
            case Kekule.BondOrder.DEFAULT:
            case Kekule.BondOrder.OTHER:
                return acc + 1;
            case Kekule.BondOrder.DOUBLE:
                return acc + 2;
            case Kekule.BondOrder.TRIPLE:
                return acc + 3;
            case Kekule.BondOrder.QUADRUPLE:
                return acc + 4;
            case Kekule.BondOrder.UNSET:
                return acc;
            case Kekule.BondOrder.EXPLICIT_AROMATIC:
                return acc + 1.5;

            default:
                return acc;
        }
    }, 0);
}

// modified from kekule.js

const defBondAngles = [];
const angle120 = (Math.PI * 2) / 3;
const angle30 = (Math.PI * 30) / 180;
// !!! disabled for now
// defBondAngles[BondOrder.EXPLICIT_AROMATIC] = [angle120];
// defBondAngles[0] = 0; // default value for unset bonds
// defBondAngles[BondOrder.Single] = [angle30];
// defBondAngles[BondOrder.Double][BondOrder.Double] = Math.PI;
// defBondAngles[BondOrder.Double] = [0];
// defBondAngles[BondOrder.Triple] = [0];

defBondAngles[0] = angle120; // default value for unset bonds
defBondAngles[BondOrder.Single] = [angle120];
defBondAngles[BondOrder.Double] = [angle120];
// defBondAngles[BondOrder.Double][BondOrder.Single] = angle30 * 4;
defBondAngles[BondOrder.Double][BondOrder.Double] = Math.PI;
defBondAngles[BondOrder.Triple] = [Math.PI];
defBondAngles[BondOrder.Triple][BondOrder.Single] = Math.PI; // !!! my addition
defBondAngles[BondOrder.Triple][BondOrder.Double] = angle120; // !!! my addition
// defBondAngles[BondOrder.Triple][BondOrder.Triple] = Math.PI; // !!! my addition

/**
 * Get the default bond angle of two valence bonds.
 * @param {Int} bondOrder1
 * @param {Int} bondOrder2
 * @returns {Float}
 */
export function getDefAngleOfBonds(bondOrder1, bondOrder2) {
    let b1 = bondOrder1 || 0;
    let b2 = bondOrder2 || 0;
    if (b1 > b2) {
        b1 = bondOrder2 || 0;
        b2 = bondOrder1 || 0;
    }
    const map = defBondAngles[b2];
    if (!map) return defBondAngles[0]; // default value for unset bonds

    const value = map[b1];
    return value || map[0];
}

/**
 * Move nodes and connectors from target to dest structure fragment.
 * @param {Kekule.StructureFragment} target
 * @param {Kekule.StructureFragment} dest
 * @param {Array} moveNodes
 * @param {Array} moveConnectors
 * @param {Bool} ignoreAnchorNodes
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function Kekule_StructureFragment_moveChildBetweenStructFragment(
    target,
    dest,
    moveNodes,
    moveConnectors,
    ignoreAnchorNodes
) {
    const CU = Kekule.CoordUtils;

    target.beginUpdate();
    dest.beginUpdate();
    const anchorNodes = target.getAnchorNodes();
    // TODO: here we need change coord if essential
    const targetCoord2D = target.getAbsCoord2D();
    const targetCoord3D = target.getAbsCoord3D();
    const destCoord2D = dest.getAbsCoord2D();
    const destCoord3D = dest.getAbsCoord3D();

    const coordDelta2D = CU.substract(targetCoord2D, destCoord2D);
    const coordDelta3D = CU.substract(targetCoord3D, destCoord3D);

    // console.log('coordDelta', coordDelta2D, coordDelta3D);

    const nodes = Kekule.ArrayUtils.clone(moveNodes);
    const connectors = Kekule.ArrayUtils.clone(moveConnectors);
    for (let i = 0, l = nodes.length; i < l; ++i) {
        const node = nodes[i];
        const index = target.indexOfNode(node);
        if (index >= 0) {
            target.removeNodeAt(index, true); // preserve linked connectors

            const oldCoord2D = node.getCoord2D();
            if (oldCoord2D) {
                const newCoord2D = CU.add(oldCoord2D, coordDelta2D);
                node.setCoord2D(newCoord2D);
            }
            const oldCoord3D = node.getCoord3D();
            if (oldCoord3D) {
                const newCoord3D = CU.add(oldCoord3D, coordDelta3D);
                node.setCoord2D(newCoord3D);
            }

            dest.appendNode(node);
            if (anchorNodes.indexOf(node) >= 0) {
                target.removeAnchorNode(node);
                if (!ignoreAnchorNodes) dest.appendAnchorNode(node);
            }
        }
    }
    for (let i = 0, l = connectors.length; i < l; ++i) {
        const connector = connectors[i];
        const index = target.indexOfConnector(connector);
        if (index >= 0) {
            target.removeConnectorAt(index, true); // preserve linked objects
            dest.appendConnector(connector);
        }
    }
}

/**
 * Returns objects directly link around chemObj.
 * If chemObj is a node, returns node.getLinkedObjs(); if chemObj is connector, returns connector.getLinkedObjs() + connector.getConnectedObjs()
 */
export function getSurroundingObjs(chemObj) {
    const objs = chemObj.getLinkedObjs();

    if (chemObj instanceof Kekule.ChemStructureConnector) {
        // a connector, should also consider other connectors connecting it
        const extraObjs = chemObj.getConnectedObjs();
        Kekule.ArrayUtils.pushUnique(objs, extraObjs);
    }
    return objs;
}

/**
 * Returns default angle when added new bond to startObj.
 * @param {Kekule.ChemObject} startObj
 * @param {Int} newBondOrder
 * @return {Float}
 */
export function getNewBondDefAngle(startObj, newBondOrder = 0) {
    let result;

    const surroundingObjs = getSurroundingObjs(startObj);
    if (surroundingObjs.length === 1) {
        // one existing bond, defAngle is decided by new bond order and existing bond order
        const existingConnector = startObj.getLinkedConnectorAt(0);
        if (existingConnector && existingConnector.getConnectedObjs().indexOf(surroundingObjs[0]) >= 0) {
            const existingBondOrder = existingConnector.getBondOrder ? existingConnector.getBondOrder() : null;
            if (Kekule.ObjUtils.notUnset(existingBondOrder)) {
                result = getDefAngleOfBonds(newBondOrder, existingBondOrder);
            }
        }
    } else if (surroundingObjs.length === 0) {
        // no connected bond, use initialDirection
        result = 0;
        if (newBondOrder === BondOrder.Single) result = (30 * Math.PI) / 180;
    } else {
        result = getDefAngleOfBonds(newBondOrder, 0);
    }
    return result;
}

/**
 * Get direction angle most empty space to a chem object.
 * This function is in 2D mode.
 * @param {Kekule.ChemStructureObject} obj
 * @param {Array} linkedObjs Objects around obj.
 * @param {Bool} allowCoordBorrow
 * @returns {Float}
 */
export function calcMostEmptyDirectionAngleOfChemObj(obj, linkedObjs, allowCoordBorrow) {
    const angles = [];
    // eslint-disable-next-line no-param-reassign
    if (!linkedObjs) linkedObjs = obj.getLinkedObjs();
    const baseCoord = obj.getAbsCoordOfMode(Kekule.CoordMode.COORD2D, allowCoordBorrow);
    for (let i = 0, l = linkedObjs.length; i < l; i += 1) {
        const c = linkedObjs[i].getAbsCoordOfMode(Kekule.CoordMode.COORD2D, allowCoordBorrow);
        const cSub = Kekule.CoordUtils.substract(c, baseCoord);
        let angle = Math.atan2(-cSub.y, cSub.x);
        if (angle < 0) angle = Math.PI * 2 + angle;
        angles.push(angle);
    }
    angles.sort();
    const degAngles = angles.map((e) => (e * 180) / Math.PI);

    const l = angles.length;
    if (l === 0) return 0;
    if (l === 1)
        // only one connector
        return -angles[0];
    // more than two connectors

    let max = 0;
    let index = 0;

    for (let i = 0; i < l; i += 1) {
        const a1 = angles[i];
        const a2 = angles[(i + 1) % l];
        let delta = a2 - a1;
        if (delta < 0) delta += Math.PI * 2;
        if (delta > max) {
            max = delta;
            index = i;
        }
    }
    const result = angles[index] + max / 2;
    return result;
}

// wrapper for function, print before and after
export function getRemovedNodesAndConnectorsAfterFunction(my_mol, func) {
    return (...args) => {
        const nodesBefore = my_mol.getConnectors().map((x) => x.id);
        const connectorsBefore = my_mol.getNodes().map((x) => x.id);

        const result = func(...args);
        // const result = my_mol.clearExplicitBondHydrogens();

        const nodesAfter = my_mol.getConnectors().map((x) => x.id);
        const connectorsAfter = my_mol.getNodes().map((x) => x.id);
        // check which nodes and connectors were removed after the function
        const removedNodes = nodesBefore.filter((x) => !nodesAfter.includes(x));
        const removedConnectors = connectorsBefore.filter((x) => !connectorsAfter.includes(x));

        // wrap them together in an object
        const removed = {
            nodes: removedNodes,
            connectors: removedConnectors,
        };
        return removed;
    };
}

/**
 * When adding a new bond to a node, this function will calculate the most suitable angle (related to X axis) of the bond direction.
 * @param {Object} startingObj
 * @param {Float} defBondAngle Default bond angle of this type of bond.
 * @param {Bool} allowCoordBorrow
 * @returns {Float}
 */
export function calcPreferred2DBondGrowingDirection(startingObj, defBondAngle, allowCoordBorrow) {
    const startingCoord = startingObj.getAbsCoordOfMode(Kekule.CoordMode.COORD2D, allowCoordBorrow);
    const connectedObjs = getSurroundingObjs(startingObj);
    const connectedObjCount = connectedObjs ? connectedObjs.length : 0;
    switch (connectedObjCount) {
        case 0: {
            // no object connected, just add a bond in defAngle
            return defBondAngle; // (Math.PI - defAngle) / 2;
        }
        case 1: {
            // only one bond, add to defAngles
            const refObj = connectedObjs[0];
            const refCoord = refObj.getAbsCoordOfMode(Kekule.CoordMode.COORD2D, allowCoordBorrow);
            const refVector = Kekule.CoordUtils.substract(startingCoord, refCoord);
            const refAngle = Math.atan2(refVector.y, -refVector.x);

            let angle1 = refAngle - defBondAngle;
            let angle2 = refAngle + defBondAngle;
            if (angle1 < 0) angle1 += Math.PI * 2;
            if (angle2 < 0) angle2 += Math.PI * 2;
            let finalAngle;
            // we have two applicable angles, if they are not the same, choose the one closest to horizontal line
            if (angle1 !== angle2) {
                const ca1 = Math.min(
                    angle1 > Math.PI ? Math.abs(angle1 - Math.PI * 2) : angle1,
                    Math.abs(angle1 - Math.PI)
                );
                const ca2 = Math.min(
                    angle2 > Math.PI ? Math.abs(angle2 - Math.PI * 2) : angle2,
                    Math.abs(angle2 - Math.PI)
                );
                finalAngle = ca1 <= ca2 ? angle1 : angle2;
            } else finalAngle = angle1;

            return finalAngle;
        }
        default: {
            // more than one bond, add to most empty direction
            const finalAngle = calcMostEmptyDirectionAngleOfChemObj(startingObj, connectedObjs, allowCoordBorrow);
            return finalAngle;
        }
    }
}

/**
 * When adding a new bond to a node, this function will calculate the most suitable location of the bond direction.
 * @param {Object} startingObj
 * @param {Float} bondLength
 * @param {Float} defAngle Default bond angle of this type of bond.
 * @param {Bool} allowCoordBorrow
 * @returns {Hash} Coord of the bond's ending point.
 */
function calcPreferred2DBondGrowingLocation(startingObj, bondLength, defAngle, allowCoordBorrow) {
    const startingCoord = startingObj.getAbsCoordOfMode(Kekule.CoordMode.COORD2D, allowCoordBorrow);
    const direction = calcPreferred2DBondGrowingDirection(startingObj, defAngle, allowCoordBorrow);
    return Kekule.CoordUtils.add(startingCoord, {
        x: bondLength * Math.cos(direction),
        y: bondLength * Math.sin(direction),
    });
}

/**
 * Load chem object from a File object.
 * Note this function relies on FileApi support.
 * @param {File} file
 * @param {Function} callback Callback function when the file is loaded. Has two params (chemObj, success, srcData).
 * @param {String | undefined} formatId If not set, format will be get from file name automatically.
 * @param {Hash | undefined} options Additional options to read data. Different data format may have different options.
 */
export function loadFileData(file, callback, formatId = undefined, options = undefined) {
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        try {
            const fileName = file.name;
            const ext = Kekule.UrlUtils.extractFileExt(fileName);
            let formatInfo;
            if (!formatId) {
                formatInfo = Kekule.IO.DataFormatsManager.findFormat(null, ext);
            } else formatInfo = Kekule.IO.DataFormatsManager.getFormatInfo(formatId);

            if (!formatInfo) {
                const msg = `ErrorMsg.NO_SUITABLE_READER_FOR_FILEEXT${ext}`;
                console.error(msg);
                return;
            }

            // const isBinary = (formatInfo.dataType === Kekule.IO.ChemDataType.BINARY);
            const isBinary = Kekule.IO.ChemDataType.isBinaryType(formatInfo.dataType);

            // try open it the file by FileReader
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = reader.result;
                const chemObj = Kekule.IO.loadFormatData(content, formatInfo.id, options);
                if (chemObj && chemObj.getSrcInfo) {
                    const info = chemObj.getSrcInfo();
                    info.fileName = fileName;
                }
                const success = chemObj !== false;
                callback(chemObj, success, content);
            };

            if (isBinary)
                // reader.readAsBinaryString(file);
                reader.readAsArrayBuffer(file);
            else reader.readAsText(file);
        } catch (e) {
            console.error("Error in Kekule.IO.loadFileData:", e);
        }
    } else {
        console.error("FileApi not supported");
    }
}

// ? Convert to buttons in the future?
enableBabel();
enableIndigo();

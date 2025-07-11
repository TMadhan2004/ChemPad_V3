/* eslint-disable no-unreachable */
import { EditorConstants } from "@constants/editor.constant";
import { LayersNames } from "@constants/enum.constants";
import * as KekuleUtils from "@src/utils/KekuleUtils";
import { LayersUtils } from "@src/utils/LayersUtils";
import Vector2 from "@utils/mathsTs/Vector2";
import _ from "lodash";

import { Atom, Bond } from "../../entities";

const getBoundingBox = (mol) => {
    // {x2: maxX, x1: minX, y2: maxY, y1: minY}
    let box = mol.getContainerBox2D();
    if (!box || !box.x1 || !box.x2 || !box.y1 || !box.y2) box = mol.getContainerBox3D();
    const { x1: minX, y1: minY, x2: maxX, y2: maxY } = box;
    return { minX, minY, maxX, maxY };
};

// formatHint: pass 'mol' if loading from MOLfile, 'smiles' for SMILES, etc.
export const drawMol = (mol, formatHint = '') => {
    const canvas = LayersUtils.getLayer(LayersNames.Root);
    const viewBox = canvas.viewbox();
    const targetCenterPoint = new Vector2(viewBox.x + 0.5 * viewBox.width, viewBox.y + 0.5 * viewBox.height);

    const molBoundingBox = getBoundingBox(mol);
    const molWidth = molBoundingBox.maxX - molBoundingBox.minX;
    const molHeight = molBoundingBox.maxY - molBoundingBox.minY;
    const molScale = EditorConstants.Scale;

    // Check for invalid bounding box or atom coordinates
    const invalidBoundingBox =
        !isFinite(molBoundingBox.minX) || !isFinite(molBoundingBox.maxX) ||
        !isFinite(molBoundingBox.minY) || !isFinite(molBoundingBox.maxY) ||
        molWidth <= 0 || molHeight <= 0;
    let fallbackUsed = false;

    // Check if any atom has invalid coordinates
    let hasInvalidAtomCoords = false;
    for (let i = 0, l = mol.getNodeCount(); i < l; i += 1) {
        const node = mol.getNodeAt(i);
        const { x, y } = _.isEmpty(node.absCoord2D) ? node.absCoord3D : node.absCoord2D;
        if (x === undefined || y === undefined || Number.isNaN(x) || Number.isNaN(y)) {
            hasInvalidAtomCoords = true;
            break;
        }
    }

    if (invalidBoundingBox || hasInvalidAtomCoords) {
        // Fallback: arrange atoms in a horizontal line at the center
        fallbackUsed = true;
        const atomCount = mol.getNodeCount();
        const spacing = 40; // px between atoms
        const startX = targetCenterPoint.x - ((atomCount - 1) * spacing) / 2;
        const y = targetCenterPoint.y;
        for (let i = 0; i < atomCount; i++) {
            const node = mol.getNodeAt(i);
            const id = Atom.generateNewId();
            node.id = id;
            node.setCoord2D({ x: startX + i * spacing, y });
            const atom = new Atom({ nodeObj: node });
            atom.execOuterDrawCommand();
            console.log(`[drawMol fallback] Atom ${i} placed at (${startX + i * spacing}, ${y})`);
        }
    } else if (formatHint === 'mol') {
        // Center the molecule in the canvas by translating all atom coordinates
        // 1. Compute molecule center
        let sumX = 0, sumY = 0, n = mol.getNodeCount();
        for (let i = 0; i < n; i++) {
            const node = mol.getNodeAt(i);
            const { x, y } = node.absCoord2D || {};
            sumX += x;
            sumY += y;
        }
        const molCenter = { x: sumX / n, y: sumY / n };
        // 2. Compute canvas center
        // (already computed as targetCenterPoint)
        // 3. Compute translation delta
        const dx = targetCenterPoint.x - molCenter.x;
        const dy = targetCenterPoint.y - molCenter.y;
        // 4. Draw atoms at translated positions
        for (let i = 0; i < n; i++) {
            const node = mol.getNodeAt(i);
            const { x, y } = node.absCoord2D || {};
            const id = Atom.generateNewId();
            node.id = id;
            node.setCoord2D({ x: x + dx, y: y + dy });
            const atom = new Atom({ nodeObj: node });
            atom.execOuterDrawCommand();
            console.log(`[drawMol molfile] Atom ${i} moved from (${x}, ${y}) to (${x + dx}, ${y + dy})`);
        }
    } else {
        // Normal centering logic
        const sourceCenterPoint = new Vector2(
            molBoundingBox.minX + 0.5 * molWidth,
            -(molBoundingBox.minY + 0.5 * molHeight)
        ).scaleNew(molScale);
        const pointsDelta = targetCenterPoint.subNew(sourceCenterPoint);
        for (let i = 0, l = mol.getNodeCount(); i < l; i += 1) {
            const node = mol.getNodeAt(i);
            const { x, y } = _.isEmpty(node.absCoord2D) ? node.absCoord3D : node.absCoord2D;
            const pos = new Vector2(x, -y).scaleSelf(molScale).addSelf(pointsDelta);
            const id = Atom.generateNewId();
            node.id = id;
            node.setCoord2D({ x: pos.x, y: pos.y });
            const atom = new Atom({ nodeObj: node });
            atom.execOuterDrawCommand();
            console.log(`[drawMol normal] Atom ${i} old: ${x},${y} new: ${pos.x},${pos.y}`);
        }
    }

    // Draw bonds
    for (let i = 0, l = mol.getConnectorCount(); i < l; i += 1) {
        const connector = mol.getConnectorAt(i);
        const id = Bond.generateNewId();
        connector.id = id;
        const bond = new Bond({ connectorObj: connector });
        bond.draw(canvas);
    }

    // merge fragments
    const realMol = KekuleUtils.getMolObject();
    KekuleUtils.MergeStructFragment(mol, realMol);
    if (fallbackUsed) {
        console.warn('[drawMol] Fallback arrangement used for molecule.');
    }
};

export const drawMolFromFile = (fileContext) => {
    if (!fileContext.format || !fileContext.content) return;
    const mol = KekuleUtils.importMoleculeFromFile(fileContext.content, fileContext.format);
    if (mol === undefined) return;
    // Pass the format as a hint for coordinate logic
    drawMol(mol, fileContext.format?.toLowerCase());
};

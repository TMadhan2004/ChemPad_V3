import * as ToolsConstants from "@constants/tools.constants";
import { LayersNames } from "@constants/enum.constants";
import { EditorHandler } from "@features/editor/EditorHandler";
import { MouseEventCallBackProperties } from "@src/types";
import { LayersUtils } from "@src/utils/LayersUtils";
import { LaunchAttrs, SimpleToolbarItemButtonBuilder } from "../ToolbarItem";
import { RegisterToolbarButtonWithName } from "../ToolsButtonMapper.helper";
import { BoxSelect } from "./SelectTemplate";
import { RegisterToolbarWithName } from "./ToolsMapper.helper";

class RectangleTool extends BoxSelect {
    shapeFillColor: string = "#ffffff";
    strokeColor: string = "#000000";
    strokeWidth: number = 2;

    clear() {
        if (this.rect) {
            this.rect.remove();
            this.rect = undefined;
        }
        this.selectionMode = -1;
    }

    onActivate(attrs?: LaunchAttrs) {
        if (!attrs) return;
        const { editor } = attrs;
        if (!editor) {
            throw new Error("RectangleTool.onActivate: missing attributes or editor");
        }
        editor.setHoverMode(false, false, false);
    }

    override createShape(eventHolder: MouseEventCallBackProperties) {
        const { mouseDownLocation } = eventHolder;
        this.rect = LayersUtils.getLayer(LayersNames.General)
            .rect(0, 0)
            .move(mouseDownLocation.x, mouseDownLocation.y)
            .fill({ color: this.shapeFillColor })
            .stroke({ color: this.strokeColor, width: this.strokeWidth });
    }

    override updateShape(eventHolder: MouseEventCallBackProperties): void {
        if (!this.rect) return;
        const { mouseCurrentLocation, mouseDownLocation } = eventHolder;
        const diff = mouseCurrentLocation.subNew(mouseDownLocation);
        const width = Math.abs(diff.x);
        const height = Math.abs(diff.y);

        // if rectangle end point coordinates are smaller than the start point
        if (diff.x < 0 || diff.y < 0) {
            const newX = Math.min(mouseDownLocation.x, mouseCurrentLocation.x);
            const newY = Math.min(mouseDownLocation.y, mouseCurrentLocation.y);
            this.rect.move(newX, newY);
        }

        this.rect.width(width).height(height);
    }

    override doAction(editor: EditorHandler): void {
        // The rectangle is already created in the main layer, no need to convert it
        if (this.rect) {
            // Create history update for undo/redo
            editor.createHistoryUpdate();
        }
        // Don't remove the shape since it's our permanent rectangle
        this.rect = undefined;
    }

    override onMouseUp(eventHolder: MouseEventCallBackProperties): void {
        if (!eventHolder.editor) return;
        if (this.selectionMode === 1) {
            this.doAction(eventHolder.editor);
            this.selectionMode = -1;
        }
    }

    override removeShape(): void {
        if (this.rect) {
            this.rect.remove();
            this.rect = undefined;
        }
    }

    override onDeactivate() {
        this.removeShape();
        this.selectionMode = -1;
    }
}

export { RectangleTool };

const rectangleTool = new RectangleTool();
RegisterToolbarWithName(ToolsConstants.ToolsNames.Rectangle, rectangleTool);

const rectangle = new SimpleToolbarItemButtonBuilder(
    "Rectangle",
    ToolsConstants.ToolsNames.Rectangle,
    ToolsConstants.ToolsShortcutsMapByToolName.get(ToolsConstants.ToolsNames.Rectangle)
);

RegisterToolbarButtonWithName(rectangle);

export default rectangle;

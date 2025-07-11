import * as ToolsConstants from "@constants/tools.constants";
import type { ToolbarItemButton } from "@features/toolbar-item/ToolbarItem";
import { AtomToolbarItemButton } from "@features/toolbar-item/tools/AtomTool";
import React from "react";

// Import SVG components directly
import {
  SelectBoxIcon,
  SelectLassoIcon,
  ChainIcon,
  ChargePlusIcon,
  ChargeMinusIcon,
  PeriodicTableIcon,
  BondSingleIcon,
  BondDoubleIcon,
  BondTripleIcon,
  BondSingleOrDoubleIcon,
  BondWedgeFrontIcon,
  BondWedgeBackIcon,
  ClearCanvasIcon,
  EraseIcon,
  CopyIcon,
  PasteIcon,
  UndoIcon,
  RedoIcon,
  ExportIcon,
  ImportIcon,
  RectangleIcon
} from "./SvgIcons";

type IconComponent = React.FC<any>;

// Create a map, where the key is the tool name and the value is the icon
const IconsMap = new Map<string, IconComponent>();

// Main tools
IconsMap.set(ToolsConstants.ToolsNames.Chain, ChainIcon);
IconsMap.set(ToolsConstants.ToolsNames.Clear, ClearCanvasIcon);
IconsMap.set(ToolsConstants.ToolsNames.Copy, CopyIcon);
IconsMap.set(ToolsConstants.ToolsNames.Erase, EraseIcon);
IconsMap.set(ToolsConstants.ToolsNames.Export, ExportIcon);
IconsMap.set(ToolsConstants.ToolsNames.Import, ImportIcon);
IconsMap.set(ToolsConstants.ToolsNames.Paste, PasteIcon);
IconsMap.set(ToolsConstants.ToolsNames.PeriodicTable, PeriodicTableIcon);
IconsMap.set(ToolsConstants.ToolsNames.Rectangle, RectangleIcon);
IconsMap.set(ToolsConstants.ToolsNames.SelectBox, SelectBoxIcon);
IconsMap.set(ToolsConstants.ToolsNames.SelectLasso, SelectLassoIcon);

// bonds
IconsMap.set(ToolsConstants.SubToolsNames.BondDouble, BondDoubleIcon);
IconsMap.set(ToolsConstants.SubToolsNames.BondSingle, BondSingleIcon);
IconsMap.set(ToolsConstants.SubToolsNames.BondTriple, BondTripleIcon);
IconsMap.set(ToolsConstants.SubToolsNames.BondSingleOrDouble, BondSingleOrDoubleIcon);
IconsMap.set(ToolsConstants.SubToolsNames.BondWedgeBack, BondWedgeBackIcon);
IconsMap.set(ToolsConstants.SubToolsNames.BondWedgeFront, BondWedgeFrontIcon);

// charge
IconsMap.set(ToolsConstants.SubToolsNames.ChargeMinus, ChargeMinusIcon);
IconsMap.set(ToolsConstants.SubToolsNames.ChargePlus, ChargePlusIcon);

// undo redo
IconsMap.set(ToolsConstants.ToolsNames.Undo, UndoIcon);
IconsMap.set(ToolsConstants.ToolsNames.Redo, RedoIcon);

// Ensure we have mappings for the exact names used in the toolbar items
IconsMap.set("Lasso Select", SelectLassoIcon);
IconsMap.set("Box Select", SelectBoxIcon);
IconsMap.set("Charge Minus", ChargeMinusIcon);
IconsMap.set("Charge Plus", ChargePlusIcon);
IconsMap.set("Periodic Table", PeriodicTableIcon);
IconsMap.set("Single Bond", BondSingleIcon);
IconsMap.set("Double Bond", BondDoubleIcon);
IconsMap.set("Triple Bond", BondTripleIcon);
IconsMap.set("Single Or Double Bond", BondSingleOrDoubleIcon);
IconsMap.set("Wedge Bond (Front)", BondWedgeFrontIcon);
IconsMap.set("Wedge Bond (Back)", BondWedgeBackIcon);
IconsMap.set("Minus Charge", ChargeMinusIcon);
IconsMap.set("Plus Charge", ChargePlusIcon);

const IconSize = "2.5rem";
const IconFontSize = "2rem";

function generateAtomIcon(tool: AtomToolbarItemButton): (props: any) => JSX.Element {
    const { attributes } = tool;
    const { label, color } = attributes;

    // create an div with label in horizontal and vertical center, and with the color
    function Icon(props: any) {
        const { height } = props;
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color,
                    fontWeight: "600",
                    fontSize: IconFontSize,
                    lineHeight: height,
                }}
                {...props}
            >
                {label}
            </div>
        );
    }

    return Icon;
}

function generateDebugIcon(tool: ToolbarItemButton): (props: any) => JSX.Element {
    const { name } = tool;

    function Icon() {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "400",
                    fontSize: "0.65em",
                    lineHeight: "0.8em",
                    height: "4em",
                    width: IconSize,
                }}
            >
                {name}
            </div>
        );
    }

    return Icon;
}

export default function getToolbarIconByName(tool: ToolbarItemButton, ...props: any) {
    const name = tool.subToolName ?? tool.toolName;
    let Icon;
    
    if (tool.toolName === ToolsConstants.ToolsNames.Atom) {
        Icon = generateAtomIcon(tool as AtomToolbarItemButton);
    } else if (tool.toolName && tool.toolName.startsWith("debug")) {
        Icon = generateDebugIcon(tool);
    } else {
        // Try to find the icon by name, subToolName, or toolName
        Icon = IconsMap.get(name) || IconsMap.get(tool.name) || IconsMap.get(tool.toolName);
        
        // Debug output to help identify missing icons
        if (!Icon) {
            console.warn(`Icon not found for: ${name}, ${tool.name}, ${tool.toolName}`);
        }
    }
    
    if (!Icon) {
        // Return a visible placeholder for missing icons
        return (
            <div 
                style={{ 
                    width: IconSize, 
                    height: IconSize, 
                    border: '1px solid #ccc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: '#999'
                }}
            >
                {name || tool.name || 'icon'}
            </div>
        );
    }
    
    return <Icon width={IconSize} height={IconSize} color="#424242" {...props} />;
}

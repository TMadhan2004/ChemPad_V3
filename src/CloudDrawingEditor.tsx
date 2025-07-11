import React, { useState, useEffect } from "react";
import Editor from "./features/editor/Editor";
import { EditorHandler } from "./features/editor/EditorHandler";
import { exportFileFromMolecule, resetChemDocument, getSupportedWriteFormats, enableBabel } from "./utils/KekuleUtils";
import { actions as toolbarActions } from "./features/toolbar-item/toolbarItemsSlice";
import { useDispatch } from "react-redux";
import styles from "@styles/index.module.scss";
import clsx from "clsx";
import chempadLogo from "@styles/icons/chempadv2.jpeg";
import { ToolbarItems, TopToolbarProps, LeftToolbarProps, RightToolbarProps, DialogShow } from "./features/toolbar-item";
import Chatbot from "./features/chatbot/Chatbot";

interface CloudDrawingEditorProps {
  drawingName: string;
  setDrawingName: (name: string) => void;
  onSave: (smiles: string, molfile: string, name: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  editorHandler: EditorHandler;
  onBack: () => void;
}

const CloudDrawingEditor: React.FC<CloudDrawingEditorProps> = ({
  drawingName,
  setDrawingName,
  onSave,
  loading,
  error,
  editorHandler,
  onBack,
}) => {
  const dispatch = useDispatch();

  return (
    <div className={clsx("App", styles.app, "cloud-mode", "fade-in")}> 
      <img 
        src={chempadLogo} 
        alt="ChemPad Logo" 
        className={clsx("chempad-logo")}
        title="ChemPad - Professional Chemistry Drawing Tool"
      />
      {/* Top Toolbar with Save + Drawing Name */}
      <div className={clsx(styles.top, "top-toolbar")}
           style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <ToolbarItems {...TopToolbarProps} />
        <input
          type="text"
          value={drawingName}
          onChange={e => setDrawingName(e.target.value)}
          placeholder="Enter drawing name"
          style={{ fontSize: 16, padding: 7, borderRadius: 6, border: '1px solid #bbb', minWidth: 180 }}
          disabled={loading}
        />
        <button
          onClick={async () => {
            enableBabel();
            editorHandler.updateAllKekuleNodes();
            // Export both MOLfile and SMILES
            const formats = getSupportedWriteFormats();
            const smilesFormat = formats.find(opt => opt.name.toLowerCase().includes('smiles'))?.value;
            const smilesFormatId = smilesFormat || formats[0].value;
            const molFormat = formats.find(opt => opt.value === 'mol')?.value || 'mol';
            const smiles = exportFileFromMolecule(smilesFormatId);
            const molfile = exportFileFromMolecule(molFormat);
            if (!smiles || smiles.trim() === "") {
              alert("ERROR: Exported SMILES is empty. Please check your drawing and try again.");
              return;
            }
            if (!molfile || molfile.trim() === "") {
              alert("ERROR: Exported MOLfile is empty. Please check your drawing and try again.");
              return;
            }
            await onSave(smiles, molfile, drawingName);
          }}
          disabled={loading || !drawingName.trim()}
          style={{ padding: '8px 18px', fontSize: 15, borderRadius: 6, background: '#ffe600', border: '1px solid #fbc02d', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onBack}
          style={{ padding: '8px 15px', fontSize: 14, borderRadius: 6, background: '#eee', border: '1px solid #bbb', fontWeight: 'bold' }}
        >
          Back to Drawings
        </button>
        {error && <span style={{ color: 'red', marginLeft: 14 }}>{error}</span>}
      </div>
      <div className={clsx(styles.right, "right-toolbar")}> <ToolbarItems {...RightToolbarProps} /> </div>
      <div className={clsx(styles.left, "left-toolbar")}> <ToolbarItems {...LeftToolbarProps} /> </div>

      <div className={clsx(styles.draw, "drawing-area")}> <Editor editorHandler={editorHandler} /> </div>
      <DialogShow editorHandler={editorHandler} />
      <Chatbot />
    </div>
  );
};

export default CloudDrawingEditor;

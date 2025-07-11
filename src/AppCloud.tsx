import React, { useState, useEffect } from "react";
import Login from "./features/Login";
import DrawingList from "./DrawingList";
import { auth, db } from "./firebaseConfig";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import Editor from "./features/editor/Editor";
import { EditorHandler } from "./features/editor/EditorHandler";
import { exportFileFromMolecule } from "./utils/KekuleUtils";
import { actions as toolbarActions } from "./features/toolbar-item/toolbarItemsSlice";
import { actions as chemistryActions } from "./features/chemistry/chemistrySlice";
import { useDispatch } from "react-redux";
// Imports for classic ChemPad layout
import styles from "@styles/index.module.scss";
import clsx from "clsx";
import chempadLogo from "@styles/icons/chempadv2.jpeg";
import { ToolbarItems, TopToolbarProps, LeftToolbarProps, RightToolbarProps, DialogShow } from "./features/toolbar-item";
import Chatbot from "./features/chatbot/Chatbot";
import CloudDrawingEditor from "./CloudDrawingEditor";

export default function AppCloud({ editing, setEditing, currentDrawing, setCurrentDrawing, user, setUser }: {
  editing: boolean;
  setEditing: (val: boolean) => void;
  currentDrawing: any;
  setCurrentDrawing: (drawing: any) => void;
  user: any;
  setUser: (user: any) => void;
}) {
  // Debug marker for render
  // eslint-disable-next-line no-console
  console.log('AppCloud RENDER', { editing, user, currentDrawing });

  // Cloud mode editor state
  const [drawingName, setDrawingName] = useState("");
  const [editorHandler] = useState(() => new EditorHandler());
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update drawingName and editor when switching drawings
  useEffect(() => {
    if (currentDrawing && (currentDrawing.molfile || currentDrawing.smiles)) {
      if (currentDrawing.molfile) {
        dispatch(toolbarActions.loadFile({ content: currentDrawing.molfile, format: "mol" }));
      } else if (currentDrawing.smiles) {
        dispatch(toolbarActions.loadFile({ content: currentDrawing.smiles, format: "smiles" }));
      }
      editorHandler.createHistoryUpdate();
      setDrawingName(currentDrawing.name || "");
    } else if (!currentDrawing && editing) {
      editorHandler.clear();
      setDrawingName("");
      dispatch(chemistryActions.resetEditor());
    }
    // eslint-disable-next-line
  }, [currentDrawing, editing]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  // Logout button always visible when logged in
  const handleLogout = async () => {
    await auth.signOut();
    setEditing(false);
  };

  if (!editing) {
    // Cloud Drawing List view
    return (
      <div style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none' }}>
        {/* Top App Bar */}
        <div style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 2vw 1vw 2vw',
          minHeight: 72,
          background: 'rgba(24,31,43,0.98)',
          boxShadow: '0 2px 16px #0002',
        }}>
          {/* Logo left */}
          <img src={chempadLogo} alt="ChemPad Logo" style={{marginLeft:-20,width: 165, height: 55, borderRadius: 8, boxShadow: '0 2px 16px #4f8cff44' }} />
          {/* Title and + button right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontSize: '2rem', fontWeight: 700, color: '#ffe600', letterSpacing: '.01em', textShadow: '0 2px 14px #0000001a' }}>Your Drawings</span>
            <button
              style={{
                background: '#ffe600',
                color: '#181f2b',
                fontWeight: 700,
                border: 'none',
                borderRadius: '50%',
                width: 56,
                height: 56,
                fontSize: '2.1rem',
                boxShadow: '0 4px 24px #ffe60044',
                cursor: 'pointer',
                transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
              }}
              title="New Drawing"
              onClick={() => { setCurrentDrawing(null); setEditing(true); }}
            >
              +
            </button>
          </div>
          {/* Logout and Switch rightmost */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              onClick={handleLogout}
              style={{
                background: '#fff',
                color: '#222',
                border: '2px solid #f44336',
                borderRadius: 8,
                padding: '8px 20px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px #f4433620',
                cursor: 'pointer',
                minWidth: 90,
              }}
            >
              Logout
            </button>
            <button
              style={{
                background: '#fff',
                color: '#4f8cff',
                border: '2px solid #4f8cff',
                borderRadius: 8,
                padding: '8px 20px',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px #4f8cff20',
                cursor: 'pointer',
                minWidth: 140,
              }}
              // TODO: Replace with actual switch logic
              title="Switch to Classic Mode"
            >
              Switch to Classic Mode
            </button>
          </div>
        </div>
        {/* Drawing list below app bar */}
        <div style={{ width: '100%', marginTop: 24, flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <DrawingList
            user={user}
            onSelect={drawing => { setCurrentDrawing(drawing); setEditing(true); }}
            onCreate={() => { setCurrentDrawing(null); setEditing(true); }}
          />
        </div>
      </div>
    );
  }

  // Cloud Mode ChemPad Editor UI
  return (
    <>
      <button
        onClick={handleLogout}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1000,
          background: '#fff',
          color: '#222',
          border: '2px solid #f44336',
          borderRadius: 8,
          padding: '8px 18px',
          fontWeight: 'bold',
        }}
      >
        Logout
      </button>
      <CloudDrawingEditor
        drawingName={drawingName}
        setDrawingName={setDrawingName}
        onSave={async (smiles, molfile, name) => {
            setLoading(true);
            setError(null);
            try {
              const payload = {
                name,
                smiles,
                molfile,
                uid: user.uid,
                createdAt: new Date().toISOString(),
              };
              if (currentDrawing && currentDrawing.id) {
                await setDoc(doc(db, "drawings", currentDrawing.id), { ...payload });
              } else {
                await addDoc(collection(db, "drawings"), payload);
              }
              setEditing(false);
            } catch (err: any) {
              setError(err.message || "Failed to save drawing.");
            } finally {
              setLoading(false);
            }
          }}
        loading={loading}
        error={error}
        editorHandler={editorHandler}
        onBack={() => setEditing(false)}
      />
    </>
  );
}

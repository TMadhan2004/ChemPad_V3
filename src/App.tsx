/* eslint-disable react/style-prop-object */
import "@styles/App.scss";
import "@features/chatbot/chatbot.css";
import "@styles/animations.scss";

import Editor from "@features/editor/Editor";
import { EditorHandler } from "@features/editor/EditorHandler";
import {
    DialogShow,
    LeftToolbarProps,
    RightToolbarProps,
    ToolbarItems,
    TopToolbarProps,
} from "@features/toolbar-item";
import Chatbot from "@features/chatbot/Chatbot";
import styles from "@styles/index.module.scss";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import chempadLogo from "@styles/icons/chempadv2.jpeg";

const editorHandler = new EditorHandler();

import AppCloud from "./AppCloud";
import { auth } from "./firebaseConfig";

function App() {
    const [loaded, setLoaded] = useState(false);
    const [cloudMode, setCloudMode] = useState(false);
    // Cloud mode state
    const [editing, setEditing] = useState(false);
    const [currentDrawing, setCurrentDrawing] = useState<any>(null);
    const [user, setUser] = useState<any>(auth.currentUser);

    // Keep user state in sync with Firebase Auth
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            setUser(firebaseUser);
            if (!firebaseUser) {
                setEditing(false);
                setCurrentDrawing(null);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        setLoaded(true);
        const resizeIcons = () => {
            const icons = document.querySelectorAll('.toolbar button svg, .toolbar button img');
            icons.forEach(icon => {
                if (icon instanceof HTMLElement) {
                    icon.style.width = '24px';
                    icon.style.height = '24px';
                }
            });
        };
        resizeIcons();
        window.addEventListener('resize', resizeIcons);
        return () => {
            window.removeEventListener('resize', resizeIcons);
        };
    }, []);

    return (
        <div className={clsx("App", styles.app, loaded && "fade-in") + (cloudMode ? " cloud-mode" : "") }>
            <button
                style={{
                    position: 'fixed',
                    top: 20,
                    right: 20,
                    zIndex: 9999,
                    fontSize: '1.1em',
                    background: cloudMode ? '#fff' : '#ffe600',
                    color: '#222',
                    border: '2px solid #fbc02d',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontWeight: 'bold',
                    boxShadow: '0 2px 12px #fbc02d88',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                }}
                onClick={() => setCloudMode(!cloudMode)}
                aria-label={cloudMode ? "Switch to Classic Mode" : "Switch to Cloud Mode"}
            >
                {cloudMode ? "Switch to Classic Mode" : "Switch to Cloud Mode"}
            </button>
            {cloudMode ? (
                <AppCloud
                  editing={editing}
                  setEditing={setEditing}
                  currentDrawing={currentDrawing}
                  setCurrentDrawing={setCurrentDrawing}
                  user={user}
                  setUser={setUser}
                />
            ) : (
                <>
                    <img 
                        src={chempadLogo} 
                        alt="ChemPad Logo" 
                        className={clsx("chempad-logo", loaded && "slide-in-left")}
                        title="ChemPad - Professional Chemistry Drawing Tool"
                    />
                    <div className={clsx(styles.top, "top-toolbar", loaded && "slide-down delay-1")}> <ToolbarItems {...TopToolbarProps} /> </div>
                    <div className={clsx(styles.right, "right-toolbar", loaded && "slide-in-right delay-2")}> <ToolbarItems {...RightToolbarProps} /> </div>
                    <div className={clsx(styles.left, "left-toolbar", loaded && "slide-in-left delay-2")}> <ToolbarItems {...LeftToolbarProps} /> </div>
                    <div className={clsx(styles.draw, "drawing-area", loaded && "scale-up delay-3")}> <Editor editorHandler={editorHandler} /> </div>
                    <DialogShow editorHandler={editorHandler} />
                    <Chatbot />
                </>
            )}
        </div>
    );
}

export default App;

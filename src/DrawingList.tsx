import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth } from "./firebaseConfig";
import styles from './styles/drawinglist.module.scss';
import chempadLogo from './styles/icons/chempadv2.jpeg';
import { User } from "firebase/auth";

export default function DrawingList({ user, onSelect, onCreate }: { user: User, onSelect: (drawing: any) => void, onCreate: () => void }) {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchDrawings = async () => {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(db, "drawings"), where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        setDrawings(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err: any) {
        setError(err.message || "Failed to fetch drawings from Firestore.");
      } finally {
        setLoading(false);
      }
    };
    fetchDrawings();
  }, [user]);

  return (
    <div className={styles["drawing-list-center"]}>
      {error && <div style={{ color: '#ff5e5e', marginBottom: 8, textAlign: 'center' }}>{error}</div>}
      {loading ? (
        <div className={styles["empty-list"]}>
          <span style={{ fontSize: 22, fontWeight: 600 }}>Loading...</span>
        </div>
      ) : (
        <div className={styles["drawing-list"]}>
          {drawings.length === 0 ? (
            <div className={styles["empty-list"]}>
              <span style={{ fontSize: 18 }}>No drawings yet.<br/>Click <b>+</b> to create your first!</span>
            </div>
          ) : (
            drawings.map(d => (
              <div key={d.id} className={styles["drawing-card"]}>
                <span className={styles["drawing-name"]}>{d.name || "Untitled Drawing"}</span>
                <button className={styles["open-btn"]} onClick={() => onSelect(d)}>Open</button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

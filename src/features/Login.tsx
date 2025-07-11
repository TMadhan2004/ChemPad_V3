import React, { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import styles from '../styles/login.module.scss';
import chempadLogo from '../styles/icons/chempadv2.jpeg';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin(userCredential.user);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles["login-bg"]}>
      {/* Animated floating molecules */}
      <div className={styles["floating-molecule"]} style={{ top: '12%', left: '6%', width: 70, height: 70 }} />
      <div className={styles["floating-molecule"]} style={{ top: '63%', left: '81%', width: 90, height: 90, animationDelay: '1.3s' }} />
      <div className={styles["floating-molecule"]} style={{ top: '40%', left: '45%', width: 40, height: 40, animationDelay: '2.2s' }} />
      <div className={styles["floating-molecule"]} style={{ top: '80%', left: '20%', width: 60, height: 60, animationDelay: '0.8s' }} />
      <div className={styles["floating-molecule"]} style={{ top: '22%', left: '75%', width: 55, height: 55, animationDelay: '2.5s' }} />

      <div className={styles["login-card"]}>
        <img src={chempadLogo} alt="ChemPad Logo" className={styles["chempad-logo"]} />
        <div className={styles["login-title"]}>
          {isRegister ? "Create your ChemPad Account" : "Welcome to ChemPad"}
        </div>
        <form className={styles["login-form"]} onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles["login-input"]}
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles["login-input"]}
            autoComplete={isRegister ? "new-password" : "current-password"}
          />
          <button type="submit" className={styles["login-btn"]}>
            {isRegister ? "Register" : "Login"}
          </button>
        </form>
        <button
          className={styles["switch-btn"]}
          type="button"
          onClick={() => setIsRegister(!isRegister)}
        >
          {isRegister ? "Already have an account? Login" : "No account? Register"}
        </button>
        {error && <div className={styles["error-msg"]}>{error}</div>}
      </div>
    </div>
  );
}

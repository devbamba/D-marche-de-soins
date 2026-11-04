import { useEffect, useState } from "react";
import {
  signInWithPassword,
  signOut,
  signUpWithPassword,
  subscribeToAuth,
  supabaseConfigured
} from "./lib/supabase.js";

export function AccountPanel() {
  const [user, setUser] = useState(null);
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let active = true;
    const unsubscribe = subscribeToAuth(({ user: nextUser }) => {
      if (active) setUser(nextUser);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        await signUpWithPassword(email.trim(), password);
        setMessage("Compte créé. Vérifiez votre boîte e-mail pour confirmer l’adresse si la confirmation est activée.");
        setMode("signin");
        setPassword("");
      } else {
        await signInWithPassword(email.trim(), password);
        setPassword("");
        setMessage("Connexion réussie.");
      }
    } catch (error) {
      setMessage(`Échec de l’opération : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setMessage("");
    try {
      await signOut();
      setMessage("Vous êtes déconnecté.");
    } catch (error) {
      setMessage(`Déconnexion impossible : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-panel" aria-label="Compte et synchronisation">
      {!supabaseConfigured ? (
        <p>La synchronisation Supabase n’est pas encore configurée. L’application continue d’enregistrer les dossiers dans ce navigateur.</p>
      ) : user ? (
        <div className="account-session">
          <p>Connecté avec <strong>{user.email}</strong>. Les dossiers enregistrés seront synchronisés avec votre compte.</p>
          <button type="button" className="btn alt" onClick={logout} disabled={busy}>Se déconnecter</button>
        </div>
      ) : (
        <>
          <h2>{mode === "signup" ? "Créer un compte" : "Connexion Supabase"}</h2>
          <form className="account-form" onSubmit={submit}>
            <label>
              Adresse e-mail
              <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
            </label>
            <label>
              Mot de passe
              <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
            </label>
            <div className="account-actions">
              <button type="submit" className="btn" disabled={busy}>{busy ? "Veuillez patienter…" : mode === "signup" ? "Créer le compte" : "Se connecter"}</button>
              <button type="button" className="btn alt" disabled={busy} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>
                {mode === "signup" ? "J’ai déjà un compte" : "Créer un compte"}
              </button>
            </div>
          </form>
        </>
      )}
      {message && <p className="account-message" role="status">{message}</p>}
    </section>
  );
}

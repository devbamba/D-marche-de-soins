import { useState } from "react";
import {
  signInWithProvider,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  supabaseConfigured
} from "./lib/supabase.js";

export function AccountPanel({ user, authReady, onSignedOut }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      onSignedOut();
      setMessage("Vous êtes déconnecté.");
    } catch (error) {
      setMessage(`Déconnexion impossible : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function continueWith(provider) {
    setBusy(true);
    setMessage("");
    try {
      await signInWithProvider(provider);
    } catch (error) {
      setMessage(`Connexion avec ${provider === "google" ? "Google" : "GitHub"} impossible : ${error.message}`);
      setBusy(false);
    }
  }

  return (
    <section className="account-panel" aria-label="Connexion au compte">
      {!supabaseConfigured ? (
        <p>La connexion est momentanément indisponible : la configuration Supabase est absente.</p>
      ) : !authReady ? (
        <p role="status">Vérification de votre session…</p>
      ) : user ? (
        <div className="account-session">
          <p>Connecté avec <strong>{user.email}</strong>. Vous pouvez accéder à vos dossiers synchronisés.</p>
          <button type="button" className="btn alt" onClick={logout} disabled={busy}>Se déconnecter</button>
        </div>
      ) : (
        <>
          <h2>{mode === "signup" ? "Créer votre compte" : "Connectez-vous pour accéder à l’application"}</h2>
          <p className="account-intro">L’accès aux dossiers est réservé aux utilisateurs connectés. Utilisez votre adresse e-mail ou continuez avec un fournisseur de compte.</p>
          <div className="account-providers">
            <button type="button" className="btn alt" onClick={() => continueWith("google")} disabled={busy}>Continuer avec Google</button>
            <button type="button" className="btn alt" onClick={() => continueWith("github")} disabled={busy}>Continuer avec GitHub</button>
          </div>
          <p className="account-provider-note">Google et GitHub doivent être activés dans la configuration Auth du projet Supabase.</p>
          <p className="account-divider"><span>ou avec votre adresse e-mail</span></p>
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
                {mode === "signup" ? "J’ai déjà un compte" : "Créer un compte avec mon e-mail"}
              </button>
            </div>
          </form>
        </>
      )}
      {message && <p className="account-message" role="status">{message}</p>}
    </section>
  );
}

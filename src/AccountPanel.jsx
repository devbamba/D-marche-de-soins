import { useEffect, useState } from "react";
import {
  completeSignup,
  sendSignupCode,
  signInWithProvider,
  signInWithPassword,
  signOut,
  supabaseConfigured,
  verifySignupCode
} from "./lib/supabase.js";

export function AccountPanel({ user, authReady, onSignedOut }) {
  const [mode, setMode] = useState("signin");
  const [signupStep, setSignupStep] = useState("name");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const signupLinkCallback = user?.user_metadata?.signup_flow === "email_password";

  useEffect(() => {
    if (!signupLinkCallback) return;
    setMode("signup");
    setSignupStep("password");
    setFullName(user.user_metadata.full_name ?? "");
    setMessage("Adresse e-mail vérifiée. Choisissez un mot de passe pour terminer l’inscription.");
  }, [signupLinkCallback, user]);

  async function submitSignin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await signInWithPassword(email.trim(), password);
      setPassword("");
      setMessage("Connexion réussie.");
    } catch (error) {
      setMessage(`Connexion impossible : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await sendSignupCode(email.trim(), fullName.trim());
      setSignupStep("code");
      setCode("");
      setMessage(`Demande envoyée à ${email.trim()}. Si le message contient un lien plutôt qu’un code, configurez le modèle « Magic link or OTP » de Supabase pour afficher {{ .Token }}.`);
    } catch (error) {
      setMessage(`Envoi du code impossible : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await verifySignupCode(email.trim(), code.trim());
      setSignupStep("password");
      setPassword("");
      setMessage("Adresse e-mail vérifiée. Choisissez maintenant un mot de passe.");
    } catch (error) {
      setMessage(`Vérification impossible : ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function finishSignup(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const verifiedName = fullName.trim() || user?.user_metadata?.full_name || "";
      await completeSignup(verifiedName, password);
      setMode("signin");
      setPassword("");
      setMessage("Votre compte est créé. Vous êtes connecté.");
    } catch (error) {
      setMessage(`Création du compte impossible : ${error.message}`);
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

  async function continueWithGoogle() {
    setBusy(true);
    setMessage("");
    try {
      await signInWithProvider("google");
    } catch (error) {
      setMessage(`Connexion avec Google impossible : ${error.message}`);
      setBusy(false);
    }
  }

  function showSignup() {
    setMode("signup");
    setSignupStep("name");
    setPassword("");
    setCode("");
    setMessage("");
  }

  function showSignin() {
    setMode("signin");
    setPassword("");
    setCode("");
    setMessage("");
  }

  const signupDescription = {
    name: "Étape 1 sur 4 · Indiquez votre nom complet.",
    email: "Étape 2 sur 4 · Saisissez votre adresse e-mail.",
    code: "Étape 3 sur 4 · Vérifiez votre adresse e-mail.",
    password: "Étape 4 sur 4 · Choisissez un mot de passe."
  };
  const activeMode = signupLinkCallback && user ? "signup" : mode;
  const activeSignupStep = signupLinkCallback && user ? "password" : signupStep;
  const completingSignup = activeMode === "signup" && activeSignupStep === "password";

  return (
    <section className="account-panel" aria-label="Connexion au compte">
      {!supabaseConfigured ? (
        <p>La connexion est momentanément indisponible : la configuration Supabase est absente.</p>
      ) : !authReady ? (
        <p role="status">Vérification de votre session…</p>
      ) : user && !completingSignup ? (
        <div className="account-session">
          <h2>Votre compte</h2>
          <p>Connecté avec <strong>{user.email}</strong>. Vous pouvez accéder à vos dossiers synchronisés.</p>
          <button type="button" className="btn alt" onClick={logout} disabled={busy}>Se déconnecter</button>
        </div>
      ) : (
        <>
          <header className="account-heading">
            <p className="account-eyebrow">Démarche de soins</p>
            <h2>{activeMode === "signup" ? "Créer un compte" : "Connexion"}</h2>
            <p>{activeMode === "signup"
              ? signupLinkCallback && user
                ? "Adresse e-mail vérifiée. Choisissez un mot de passe pour terminer l’inscription."
                : signupDescription[activeSignupStep]
              : "Connectez-vous pour retrouver vos dossiers."}</p>
          </header>
          {activeMode === "signin" ? (
            <>
              <p className="account-divider"><span>par e-mail</span></p>
              <form className="account-form" onSubmit={submitSignin}>
                <label>
                  Adresse e-mail
                  <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
                </label>
                <label>
                  Mot de passe
                  <input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} />
                </label>
                <div className="account-actions">
                  <button type="submit" className="btn" disabled={busy}>{busy ? "Veuillez patienter…" : "Se connecter"}</button>
                </div>
              </form>
            </>
          ) : activeSignupStep === "name" ? (
            <form className="account-form" onSubmit={event => {
              event.preventDefault();
              if (!fullName.trim()) {
                setMessage("Veuillez saisir votre nom complet.");
                return;
              }
              setSignupStep("email");
              setMessage("");
            }}>
              <label>
                Nom complet
                <input type="text" autoComplete="name" required value={fullName} onChange={event => setFullName(event.target.value)} />
              </label>
              <div className="account-actions">
                <button type="submit" className="btn">Continuer</button>
              </div>
            </form>
          ) : activeSignupStep === "email" ? (
            <form className="account-form" onSubmit={sendCode}>
              <label>
                Adresse e-mail
                <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} />
              </label>
              <div className="account-actions">
                <button type="submit" className="btn" disabled={busy}>{busy ? "Envoi en cours…" : "Recevoir le code"}</button>
              </div>
              <button type="button" className="account-back" disabled={busy} onClick={() => { setSignupStep("name"); setMessage(""); }}>← Modifier le nom</button>
            </form>
          ) : activeSignupStep === "code" ? (
            <form className="account-form" onSubmit={verifyCode}>
              <label>
                Code reçu par e-mail
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={code}
                  onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </label>
              <div className="account-actions">
                <button type="submit" className="btn" disabled={busy}>{busy ? "Vérification…" : "Vérifier le code"}</button>
              </div>
              <button type="button" className="account-back" disabled={busy} onClick={sendCode}>Renvoyer le code</button>
              <button type="button" className="account-back" disabled={busy} onClick={() => { setSignupStep("email"); setMessage(""); }}>← Modifier l’adresse e-mail</button>
            </form>
          ) : (
            <form className="account-form" onSubmit={finishSignup}>
              <label>
                Mot de passe
                <input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event => setPassword(event.target.value)} />
              </label>
              <div className="account-actions">
                <button type="submit" className="btn" disabled={busy}>{busy ? "Création en cours…" : "Terminer l’inscription"}</button>
              </div>
            </form>
          )}
          <div className="account-providers">
            <p className="account-divider"><span>ou</span></p>
            <button type="button" className="btn alt" onClick={continueWithGoogle} disabled={busy}>Continuer avec Google</button>
          </div>
          {!signupLinkCallback && (
            <p className="account-switch">
              {activeMode === "signup" ? "Vous avez déjà un compte ?" : "Vous n’avez pas encore de compte ?"}
              <button type="button" disabled={busy} onClick={activeMode === "signup" ? showSignin : showSignup}>
                {activeMode === "signup" ? "Se connecter" : "Créer un compte"}
              </button>
            </p>
          )}
        </>
      )}
      {message && <p className="account-message" role="status">{message}</p>}
    </section>
  );
}

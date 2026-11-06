import { useEffect, useRef, useState } from "react";
import { LandingPage } from "./LandingPage.jsx";
import { RecordsList } from "./RecordsList.jsx";
import { AccountPanel } from "./AccountPanel.jsx";
import { subscribeToAuth, supabaseConfigured } from "./lib/supabase.js";

export function AppShell({ onReady }) {
  const publicLanding = new URLSearchParams(window.location.search).get("landing") === "promo";
  const [view, setView] = useState("landing");
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!supabaseConfigured);
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (publicLanding) return;
    const handleViewChange = event => {
      if (event.detail.view !== "landing" && !userRef.current) {
        setView("landing");
        document.querySelector("#connexion")?.scrollIntoView({ behavior: "smooth" });
        document.querySelector("#connexion input")?.focus({ preventScroll: true });
        return;
      }
      setView(event.detail.view);
    };
    const handleAccountChange = event => setUser(event.detail.user);
    window.addEventListener("demarche:view", handleViewChange);
    window.addEventListener("demarche:account-updated", handleAccountChange);
    onReady();
    const unsubscribe = subscribeToAuth(({ user: nextUser }) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => {
      window.removeEventListener("demarche:view", handleViewChange);
      window.removeEventListener("demarche:account-updated", handleAccountChange);
      unsubscribe();
    };
  }, [onReady, publicLanding]);

  useEffect(() => {
    if (!user && view !== "landing") setView("landing");
  }, [user, view]);

  useEffect(() => {
    if (view === "records") document.querySelector("#recordsHeading")?.focus();
  }, [view]);

  if (publicLanding) {
    return <LandingPage publicOnly />;
  }

  return (
    <>
      <LandingPage
        hidden={view !== "landing"}
        user={user}
        accountPanel={<AccountPanel user={user} authReady={authReady} onSignedOut={() => setView("landing")}/>}
      />
      <div className={`wrap app-view${view === "landing" ? " hidden" : ""}`} id="appView">
        <header className="top">
          <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="#fff"/><path d="M6 25h10l4-11 7 22 5-15 3 4h7" fill="none" stroke="#0b7a9e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <div><h1>Démarche de soins</h1><button type="button" className="back-home" id="backHome">← Accueil</button></div>
          <button type="button" className="appearance-toggle" id="appearanceToggle" data-appearance-toggle aria-label="Choisir l’apparence" aria-expanded="false" aria-controls="appearanceMenu" title="Choisir l’apparence">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9c0-.5-.04-.99-.12-1.47A7 7 0 0 1 13.47 3.12 9 9 0 0 0 12 3Z"/></svg>
          </button>
          <button type="button" className="menu-toggle" id="menuToggle" aria-expanded="false" aria-controls="nav" aria-label="Ouvrir le menu de navigation"><span className="menu-icon" aria-hidden="true"><span/><span/><span/></span></button>
          <div className="appearance-menu hidden" id="appearanceMenu" role="group" aria-label="Choisir le mode d’apparence">
            <button type="button" className="appearance-option" data-appearance="system">Selon l’appareil</button>
            <button type="button" className="appearance-option" data-appearance="light">Clair</button>
            <button type="button" className="appearance-option" data-appearance="dark">Sombre</button>
          </div>
          <nav id="nav" className="nav hidden" aria-label="Navigation principale"/>
        </header>
        <button type="button" className="btn alt install-app hidden" id="installApp">Installer l’application</button>
        <section id="recordsPanel" className={`records-panel${view === "records" ? "" : " hidden"}`} aria-labelledby="recordsHeading">
          <div className="records-heading">
            <h2 id="recordsHeading" tabIndex="-1">Mes dossiers</h2>
            <button type="button" className="btn alt" id="backToForm">Retour à la démarche</button>
          </div>
          <div className="records-actions">
            <button type="button" className="btn alt" id="newRecord">Nouveau dossier</button>
            <button type="button" className="btn alt" id="exportRecords">Sauvegarder (JSON)</button>
            <button type="button" className="btn alt" id="importRecords">Restaurer</button>
            {supabaseConfigured && user && <button type="button" className="btn alt" id="syncLocalRecords">Importer les dossiers locaux dans mon compte</button>}
            <input type="file" id="importFile" accept=".json,application/json" className="hidden" aria-label="Choisir un fichier de sauvegarde"/>
          </div>
          <p className="demo-warning compact">{user ? "Les dossiers de votre compte sont synchronisés avec Supabase. Le brouillon reste local à ce navigateur." : "Stockage local à ce navigateur : les dossiers ne sont pas synchronisés et peuvent être effacés en supprimant les données du navigateur."}</p>
          <div id="recordsList"><RecordsList/></div>
        </section>
        <div id="msg" className="msg" role="alert"/>
        <div id="status" className="status" role="status"/>
        <div id="form" className={view === "records" ? "hidden" : ""}/>
        <pre id="out" className="hidden"/>
        <section id="pdfPreview" className="pdf-preview hidden" aria-labelledby="pdfPreviewHeading">
          <div className="pdf-preview-toolbar">
            <div>
              <h2 id="pdfPreviewHeading">Aperçu du dossier</h2>
              <p>Relisez le document ci-dessous. Choisissez ensuite de l’enregistrer en PDF, de l’imprimer ou de fermer l’aperçu.</p>
            </div>
            <div className="pdf-preview-actions">
              <button type="button" className="btn alt" id="closePreview">Fermer sans imprimer</button>
              <button type="button" className="btn alt" id="printPreview">Imprimer</button>
              <button type="button" className="btn" id="savePreviewPdf">Enregistrer en PDF</button>
            </div>
            <p className="pdf-save-hint">Après avoir choisi « Enregistrer en PDF », sélectionnez cette option comme destination dans la fenêtre du navigateur, puis enregistrez le fichier sur votre appareil.</p>
          </div>
          <article id="printReport" className="print-report" aria-label="Dossier patient à imprimer"/>
        </section>
      </div>
    </>
  );
}

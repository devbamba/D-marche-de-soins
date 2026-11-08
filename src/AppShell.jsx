import { useEffect, useState } from "react";
import { LandingPage } from "./LandingPage.jsx";
import { RecordsList } from "./RecordsList.jsx";

export function AppShell({ onReady }) {
  const publicLanding = new URLSearchParams(window.location.search).get("landing") === "promo";
  const [view, setView] = useState("landing");

  useEffect(() => {
    if (publicLanding) return;
    const handleViewChange = event => {
      setView(event.detail.view);
    };
    window.addEventListener("demarche:view", handleViewChange);
    onReady();
    return () => {
      window.removeEventListener("demarche:view", handleViewChange);
    };
  }, [onReady, publicLanding]);

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
      />
      <div className={`wrap app-view${view === "landing" ? " hidden" : ""}`} id="appView">
        <header className="top">
          <img className="app-logo" src="./logo.png" alt="Logo de l’application"/>
          <div><h1 className="sr-only">Démarche de soins</h1><button type="button" className="back-home" id="backHome">← Accueil</button></div>
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
            <input type="file" id="importFile" accept=".json,application/json" className="hidden" aria-label="Choisir un fichier de sauvegarde"/>
          </div>
          <p className="demo-warning compact">Stockage local à ce navigateur : les dossiers ne sont pas synchronisés entre appareils et peuvent être effacés en supprimant les données du navigateur.</p>
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

import { useEffect, useState } from "react";
import { LandingPage } from "./LandingPage.jsx";
import { RecordsList } from "./RecordsList.jsx";

const onboardingSteps = [
  {
    title: "Recueillir les données",
    description: "Rassemblez les informations générales et explorez les besoins fondamentaux de la personne."
  },
  {
    title: "Analyser la situation",
    description: "Repérez les besoins perturbés et reliez les signes observés aux problèmes et à leurs causes."
  },
  {
    title: "Planifier les soins",
    description: "Définissez des objectifs adaptés et les interventions qui permettront de les atteindre."
  },
  {
    title: "Finaliser le dossier",
    description: "Relisez votre démarche, enregistrez le dossier et préparez-le pour l’impression ou l’export."
  }
];

export function AppShell({ onReady }) {
  const publicLanding = new URLSearchParams(window.location.search).get("landing") === "promo";
  const [view, setView] = useState("landing");
  const [onboardingStep, setOnboardingStep] = useState(null);
  const [onboardingError, setOnboardingError] = useState("");

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

  useEffect(() => {
    if (onboardingStep === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [onboardingStep]);

  useEffect(() => {
    if (publicLanding || !window.matchMedia("(max-width: 650px)").matches) return;
    try {
      if (localStorage.getItem("demarcheSoins.onboarding.v1") !== "completed") {
        setOnboardingStep(0);
      }
    } catch (error) {
      setOnboardingError(`La présentation est disponible, mais sa préférence ne peut pas être lue : ${error instanceof Error ? error.message : "stockage indisponible"}`);
      setOnboardingStep(0);
    }
  }, [publicLanding]);

  function finishOnboarding() {
    try {
      localStorage.setItem("demarcheSoins.onboarding.v1", "completed");
    } catch (error) {
      const status = document.querySelector("#status");
      if (status) {
        status.textContent = `La présentation est terminée, mais ce choix ne peut pas être enregistré : ${error instanceof Error ? error.message : "stockage indisponible"}`;
      }
    }
    setOnboardingStep(null);
    setView("app");
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function continueOnboarding() {
    if (onboardingStep === null) return;
    if (onboardingStep < onboardingSteps.length - 1) {
      setOnboardingStep(onboardingStep + 1);
      return;
    }
    finishOnboarding();
  }

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
          <div className="app-brand">
            <img className="app-logo" src="./logo.png" alt="Démarche de Soins"/>
            <div>
              <h1 className="sr-only">Démarche de Soins</h1>
              <button type="button" className="back-home" id="backHome">← Accueil</button>
            </div>
          </div>
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
      {onboardingStep !== null && (
        <div className="onboarding-backdrop">
          <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboardingTitle" aria-describedby="onboardingDescription">
            <header className="onboarding-brand">
              <img src="./logo.png" alt="Démarche de Soins"/>
            </header>
            <p className="onboarding-count" aria-live="polite">Étape {onboardingStep + 1} sur {onboardingSteps.length}</p>
            <div className="onboarding-progress" aria-hidden="true">
              {onboardingSteps.map((step, index) => (
                <span key={step.title} className={index <= onboardingStep ? "is-current" : ""}/>
              ))}
            </div>
            <p className="onboarding-eyebrow">Votre parcours de soins</p>
            <h2 id="onboardingTitle" tabIndex="-1" autoFocus>{onboardingSteps[onboardingStep].title}</h2>
            <p className="onboarding-description" id="onboardingDescription">{onboardingSteps[onboardingStep].description}</p>
            <p className="onboarding-notice">Utilisez uniquement des situations fictives. Les dossiers restent enregistrés sur cet appareil.</p>
            {onboardingError && <p className="onboarding-error" role="alert">{onboardingError}</p>}
            <div className="onboarding-actions">
              <button type="button" className="btn" onClick={continueOnboarding}>Continuer</button>
              <button type="button" className="onboarding-skip" onClick={finishOnboarding}>Passer</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

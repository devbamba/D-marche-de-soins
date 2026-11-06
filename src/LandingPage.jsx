export function LandingPage({ hidden = false, publicOnly = false }) {
  const appUrl = new URL(window.location.href);
  appUrl.searchParams.delete("landing");
  appUrl.hash = "";
  const appPath = `${appUrl.pathname}${appUrl.search}`;

  return (
    <div className={`landing-page${hidden ? " hidden" : ""}`} id="landingPage">
      <header className="landing-header">
        <a className="landing-brand" href="#accueil" aria-label="Démarche de soins, accueil">
          <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="currentColor"/><path d="M6 25h10l4-11 7 22 5-15 3 4h7" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span>Démarche de soins</span>
        </a>
        <button type="button" className="landing-menu-toggle" id="landingMenuToggle" aria-expanded="false" aria-controls="landingNav" aria-label="Ouvrir le menu de navigation">
          <span className="menu-icon" aria-hidden="true"><span/><span/><span/></span>
        </button>
        <nav className="landing-nav" id="landingNav" aria-label="Navigation de présentation">
          <span className="landing-nav-title">Navigation</span>
          <a href="#fonctionnalites">Fonctionnalités</a>
          {publicOnly
            ? <a className="btn landing-nav-cta" href={appPath}>Ouvrir l’application <span aria-hidden="true">→</span></a>
            : <button type="button" className="btn landing-nav-cta" data-open-app>Ouvrir l’application <span aria-hidden="true">→</span></button>}
        </nav>
      </header>
      <main id="accueil">
        <section className="landing-hero">
          <div className="landing-copy">
            <p className="landing-eyebrow"><span/> Un outil pratique pour les étudiants en soins infirmiers</p>
            <h1>Construisez votre démarche de soins, <span>étape par étape.</span></h1>
            <p className="landing-description">Du recueil de données au plan de soins, retrouvez vos repères dans un espace clair, conçu pour vous accompagner dans votre travail.</p>
            <div className="landing-actions">
              {publicOnly
                ? <a className="btn landing-primary" href={appPath}>Ouvrir l’application <span aria-hidden="true">→</span></a>
                : <button type="button" className="btn landing-primary" data-open-app>Ouvrir l’application <span aria-hidden="true">→</span></button>}
              <a className="landing-secondary" href="#fonctionnalites">Voir les fonctionnalités <span aria-hidden="true">↓</span></a>
            </div>
            <p className="landing-note"><span aria-hidden="true">✓</span> Accès sans compte pour le moment · Utilisez uniquement des cas fictifs</p>
          </div>
          <div className="device-showcase" aria-label="Aperçu de l’application sur ordinateur, tablette et smartphone">
            <div className="device device-laptop">
              <div className="laptop-screen">
                <div className="preview-topbar"><span className="preview-brand-mark">+</span><b>Démarche de soins</b><span className="preview-top-menu">☰</span></div>
                <div className="preview-workspace">
                  <aside className="preview-sidebar"><i/><i/><i/><i/><i/></aside>
                  <div className="preview-main">
                    <div className="preview-heading"><span>Votre dossier de soins</span><b>Étapes de la démarche</b></div>
                    <div className="preview-progress"><span/></div>
                    <div className="preview-two-cards">
                      <div className="preview-card"><small>RECUEIL DE DONNÉES</small><b>Identification du patient</b><i/><i className="short"/></div>
                      <div className="preview-card"><small>ANALYSE</small><b>Besoins fondamentaux</b><div className="preview-tag">14 besoins à explorer</div></div>
                    </div>
                    <div className="preview-card preview-wide"><small>PLANIFICATION DES SOINS</small><b>Vos objectifs et interventions</b><div className="preview-table"><i/><i/><i/></div></div>
                  </div>
                </div>
              </div>
              <div className="laptop-base"/>
              <span className="device-caption">Ordinateur</span>
            </div>
            <div className="device device-tablet" aria-hidden="true">
              <div className="tablet-screen">
                <div className="tablet-appbar"><span className="preview-brand-mark">+</span><b>Démarche de soins</b></div>
                <div className="tablet-content"><small>RECUEIL DE DONNÉES</small><b>Identification du patient</b><i/><i className="short"/><div className="tablet-section">14 besoins fondamentaux <span>⌄</span></div><div className="tablet-line"/><div className="tablet-line half"/></div>
              </div>
              <span className="device-caption">Tablette</span>
            </div>
            <div className="device device-phone" aria-hidden="true">
              <div className="phone-screen">
                <div className="phone-notch"/>
                <div className="phone-appbar"><span className="preview-brand-mark">+</span><b>Démarche de soins</b><span>☰</span></div>
                <div className="phone-content"><small>ÉTAPE 1 SUR 5</small><b>Identification du patient</b><i/><i/><i className="short"/><div className="phone-button"/></div>
              </div>
              <span className="device-caption">Smartphone</span>
            </div>
            <div className="showcase-orbit orbit-one"/>
            <div className="showcase-orbit orbit-two"/>
          </div>
        </section>
        <section className="landing-features" id="fonctionnalites">
          <div className="features-heading">
            <p className="landing-eyebrow">Un accompagnement structuré</p>
            <h2>Tout le parcours, au même endroit</h2>
            <p>Avancez à votre rythme et gardez une vue claire sur chaque partie de votre démarche.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card"><span className="feature-icon icon-teal" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="13" cy="10" r="5"/><path d="M4.5 26v-2.2a8.5 8.5 0 0 1 17 0V26zM23 7.5a4.5 4.5 0 0 1 0 8.8M25 19a7 7 0 0 1 3 5.8V26h-4"/></svg></span><h3>Recueillir les données</h3><p>Organisez les renseignements du patient et explorez les 14 besoins fondamentaux.</p></article>
            <article className="feature-card"><span className="feature-icon icon-blue" aria-hidden="true"><svg viewBox="0 0 32 32"><circle cx="7" cy="8" r="3"/><circle cx="25" cy="8" r="3"/><circle cx="16" cy="24" r="3"/><path d="M10 8h6a5 5 0 0 1 5 5v1M22 11l-2 3 4 1M9 11v5a5 5 0 0 0 5 5h1M13 18l2 3-3 2"/></svg></span><h3>Faire les liens</h3><p>Repérez les besoins non satisfaits et reliez les problèmes aux causes observées.</p></article>
            <article className="feature-card"><span className="feature-icon icon-violet" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M16 4 27 9v7c0 6.4-4.5 10.6-11 13-6.5-2.4-11-6.6-11-13V9z"/><path d="m11 16 3.2 3.2L21.5 12"/></svg></span><h3>Préparer les soins</h3><p>Formulez des diagnostics, des objectifs mesurables et des interventions adaptées.</p></article>
            <article className="feature-card"><span className="feature-icon icon-amber" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M5 26V17M13 26V11M21 26V6M29 26V14"/><path d="m4 11 8-4 8 2 8-5M24 4h4v4"/></svg></span><h3>Suivre sa progression</h3><p>Visualisez les sections renseignées et repérez les objectifs qu’il reste à compléter.</p></article>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><span>Démarche de soins</span><span>Outil pédagogique de démonstration · Patients fictifs uniquement</span></footer>
    </div>
  );
}

 Démarche de soins infirmiers

Ceci est une application web pédagogique conçue pour accompagner les étudiants en sciences infirmières dans l'apprentissage et la réalisation de la démarche de soins infirmiers.

Son objectif est de proposer un espace numérique simple, structuré et intuitif permettant de recueillir les données d'un patient, de les organiser et, progressivement, de construire un raisonnement clinique infirmier.

---

🎯 Vision du projet

La démarche de soins constitue une compétence fondamentale dans la formation infirmière. Pourtant, son apprentissage et sa mise en pratique peuvent parfois être difficiles, notamment lorsqu'il s'agit d'organiser les données recueillies, d'identifier les problèmes de santé et de planifier les soins.

Mon application ambitionne de faciliter cet apprentissage à travers un outil numérique qui accompagne progressivement l'étudiant dans les différentes étapes de la démarche de soins.

Le projet s'inscrit dans une volonté de contribuer à la modernisation des outils pédagogiques en sciences infirmières, avec une attention particulière portée aux besoins des étudiants en formation au Sénégal et, plus largement, dans l'espace francophone.

✨ Fonctionnalités actuelles

La version actuelle du projet propose :

- Gestion des dossiers : création, consultation et suppression de dossiers.
- Renseignements généraux : saisie des informations relatives au patient.
- Recueil de données : exploration des 14 besoins fondamentaux selon le modèle conceptuel de Virginia Henderson.
- Approche multidimensionnelle : organisation des observations selon les dimensions biologique, psychologique et sociologique.
- Organisation des observations : distinction entre les données recueillies auprès du patient et celles issues du dossier ou de l'équipe soignante.
- Histoire de la maladie : aide à la rédaction et à la structuration des informations.
- Constantes vitales : saisie des paramètres physiologiques et calcul automatique de l'IMC.
- Analyse et planification : besoins non satisfaits, liens entre les éléments, diagnostics, objectifs, interventions et plan de soins.
- Accès temporairement ouvert sans création de compte ni connexion ; les dossiers peuvent être enregistrés localement dans le navigateur.
- Synchronisation Supabase facultative lorsque l’utilisateur est déjà connecté, avec reprise des brouillons locaux dans le navigateur.
- Prévisualisation et impression : génération d'un document imprimable pouvant être enregistré au format PDF.

🚀 Fonctionnalités envisagées

C'est un projet évolutif. Les prochaines étapes de développement visent à enrichir progressivement la démarche de soins :

- Analyse et interprétation des données recueillies.
- Identification des problèmes réels et potentiels.
- Formulation des diagnostics infirmiers.
- Hiérarchisation des problèmes selon leur degré de priorité.
- Définition des objectifs de soins.
- Planification des interventions infirmières.
- Distinction entre interventions autonomes, interventions sur prescription et interventions en collaboration.
- Évaluation des résultats et réajustement du plan de soins.
- Amélioration de l'exportation et de la présentation des dossiers.

Ces évolutions seront développées progressivement, en privilégiant la cohérence pédagogique et le raisonnement clinique infirmier.

🛠️ Technologies utilisées

L’application utilise une architecture de migration progressive :

Technologie| Utilisation
HTML5| Point de montage de l'application
CSS3| Mise en forme et interface utilisateur
React| Écrans, formulaire, navigation, dossiers et aperçu imprimable
JavaScript| Calculs métier, validation, sauvegarde locale et préparation des exports
Vite| Serveur de développement et génération de la version de production
Supabase| Authentification par e-mail et synchronisation facultative des dossiers
LocalStorage| Brouillon local et copie hors ligne des dossiers
GitHub Pages| Hébergement de l'application

Tous les écrans et champs de l'application sont maintenant rendus par React, y compris les 14 besoins, les listes dynamiques d'analyse et de planification, ainsi que l'aperçu du document. Les fonctions métier et de stockage restent en JavaScript et conservent le format des dossiers existants.

### Activer Supabase

La configuration Supabase est facultative pour utiliser l’application localement. Elle permet de synchroniser les dossiers avec un compte connecté. Configurez le projet si vous souhaitez activer cette synchronisation :

1. Créez un projet Supabase et exécutez le script [supabase/schema.sql](./supabase/schema.sql) dans le SQL Editor. La table utilise Row Level Security (RLS) pour que chaque compte n’accède qu’à ses dossiers.
2. Dans **Authentication → URL Configuration**, définissez l’URL du site publiée et ajoutez-la aux URL de redirection autorisées. Pour GitHub Pages, l’URL ressemble à `https://<utilisateur>.github.io/<depot>/`.
3. Pour activer **Google**, ouvrez **Authentication → Sign In / Providers**, activez Google et saisissez ses identifiants OAuth. Créez un identifiant OAuth dans Google Cloud Console et utilisez l’URL de rappel affichée par Supabase comme URI de redirection autorisée. Ces identifiants OAuth ne sont pas ceux des utilisateurs de l’application.
4. Copiez [.env.example](./.env.example) vers `.env.local`, puis remplacez les valeurs par l’URL du projet et sa clé **publishable** (ou clé `anon`). Ne renseignez jamais une clé `service_role` dans l’application.
5. Lancez `npm run dev`. L’application reste utilisable sans compte et enregistre les dossiers dans le navigateur. Les utilisateurs déjà connectés peuvent continuer à synchroniser leurs dossiers avec Supabase.
6. Pour GitHub Pages, ajoutez les variables de dépôt `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans **Settings → Secrets and variables → Actions → Variables**, puis relancez le workflow de déploiement.
7. Les dossiers locaux déjà enregistrés ne sont pas envoyés automatiquement. Connectez-vous, ouvrez **Mes dossiers** et utilisez **Importer les dossiers locaux dans mon compte**. Les dossiers déjà présents dans le compte ne sont pas remplacés.

Si une synchronisation échoue, l’application conserve le dossier sur l’appareil et affiche l’erreur ; réessayez lorsque la connexion sera rétablie. Une clé publishable est destinée au navigateur, mais les politiques RLS sont indispensables.

💻 Installation et utilisation

Pour tester ou modifier localement :

1. Cloner le dépôt :
   
   git clone https://github.com/devbamba/D-marche-de-soins.git

2. Accéder au dossier :
   
   cd D-marche-de-soins

3. Installer Node.js 22.12 ou une version plus récente, puis les dépendances et le serveur de développement :

   npm install
   npm run dev

Pour vérifier la version de production :

   npm run build
   npm run preview

Le site prêt à être publié est généré dans le dossier `dist/`. Pour GitHub Pages, configurez la source de publication sur **GitHub Actions** ; le workflow du dépôt construit et publie ce dossier. Ne pas ouvrir directement `index.html` : Vite doit compiler les modules React.

⚠️ Avertissement important

Cette application est actuellement un outil pédagogique en développement.

- Elle est destinée à l'apprentissage de la démarche de soins infirmiers.
- Les informations sont sauvegardées localement dans le navigateur utilisé.
- Sans connexion, les dossiers sont enregistrés dans le navigateur et ne sont pas synchronisés entre appareils.
- Le stockage local actuel ne constitue pas un dispositif de sécurité adapté aux données médicales.
- Il est fortement recommandé de travailler exclusivement avec des cas fictifs et de ne pas y saisir de données personnelles ou médicales réelles.

Elle ne remplace ni le jugement clinique, ni la supervision pédagogique, ni les protocoles et recommandations professionnelles.

🤝 Contribution

C'est un projet en évolution. Les retours, suggestions et propositions d'amélioration sont les bienvenus.

Les contributions peuvent notamment concerner :

- L'amélioration de l'expérience utilisateur.
- La pertinence des contenus pédagogiques.
- L'organisation des différentes étapes de la démarche de soins.
- La correction des erreurs et l'amélioration du code.

👨‍💻 À propos du projet

C'est un projet personnel à vocation pédagogique, porté par une volonté de mettre le numérique au service de la formation infirmière.

Une idée simple : rendre la démarche de soins plus accessible, plus structurée et plus facile à apprendre.

---

Apprendre, raisonner et planifier les soins autrement.

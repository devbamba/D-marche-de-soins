/* ===== 1. CONFIGURATION : on modifie les champs ici, l’affichage suit ===== */
const OPT = {
  sexe:["Masculin","Féminin"],
  religion:["Musulman(e)","Chrétien(ne)","Animiste","Autre"],
  civil:["Célibataire","Marié(e)","Veuf / Veuve","Divorcé(e)"],
  menage:["Monogame","Polygame","Autre"]
};
const S = [
 {id:"a", t:"Identification du patient", f:[
  {id:"prenom",l:"Prénom",ty:"text",req:1},
  {id:"nom",l:"Nom",ty:"text",req:1},
  {id:"age",l:"Âge (ans)",ty:"number",req:1,min:0,max:120},
  {id:"sexe",l:"Sexe",ty:"select",o:OPT.sexe,req:1},
  {id:"religion",l:"Religion",ty:"select",o:OPT.religion},
  {id:"ethnie",l:"Ethnie",ty:"text"},
  {id:"civil",l:"État civil",ty:"select",o:OPT.civil},
  {id:"menage",l:"Type de ménage",ty:"select",o:OPT.menage},
  {id:"profession",l:"Profession",ty:"text"},
  {id:"travail",l:"Lieu de travail",ty:"text"},
  {id:"adresse",l:"Adresse du domicile",ty:"text",full:1},
  {id:"entree",l:"Date d’entrée",ty:"date",req:1},
  {id:"lieu",l:"Lieu d’hospitalisation (service)",ty:"text",req:1},
  {id:"diag",l:"Diagnostic d’entrée",ty:"text",req:1,full:1}
 ]},
 {id:"b", t:"Antécédents", f:[
  {id:"ant_med",l:"Personnels : médicaux",ty:"area",full:1},
  {id:"ant_chir",l:"Personnels : chirurgicaux",ty:"area",full:1},
  {id:"ant_obs",l:"Personnels : obstétricaux",ty:"area",full:1,show:d=>d.sexe==="Féminin"},
  {id:"ant_fam",l:"Familiaux",ty:"area",full:1}
 ]},
 {id:"c", t:"Modes de vie", f:[
  {id:"imc",l:"Obésité : IMC",ty:"imc",full:1},
  {id:"alcool",l:"Alcoolisme",ty:"yn"},
  {id:"sport",l:"Pratique du sport",ty:"yn"},
  {id:"sport_freq",l:"Fréquence du sport",ty:"text",show:d=>d.sport==="Oui",full:1},
  {id:"alim",l:"Habitudes alimentaires",ty:"area",full:1}
 ]},
 {id:"d", t:"Résumé de l’histoire de la maladie", f:[
  {id:"guide",ty:"guide",full:1},
  {id:"histoire",l:"Résumé",ty:"area",full:1,req:1}
 ]},
 {id:"e", t:"Examen clinique", f:[
  {id:"examen",l:"Observations de l’examen clinique",ty:"area",full:1}
 ]},
 {id:"f", t:"Constantes du jour", f:[
  {id:"c_date",l:"Date et heure",ty:"datetime-local"},
  {id:"temp",l:"Température (°C)",ty:"number",step:"0.1",min:30,max:45},
  {id:"ta",l:"Tension artérielle (mmHg)",ty:"text",ph:"ex. 120/80"},
  {id:"pouls",l:"Pouls (bpm)",ty:"number",min:20,max:250},
  {id:"fr",l:"Fréquence respiratoire (/min)",ty:"number",min:4,max:80},
  {id:"spo2",l:"SpO₂ (%)",ty:"number",min:50,max:100},
  {id:"poids",l:"Poids (kg)",ty:"number",min:1,max:300,step:"0.1"},
  {id:"taille",l:"Taille (cm)",ty:"number",min:30,max:250},
 ]},
 {id:"g", t:"Données supplémentaires", f:[
  {id:"supp",l:"Autres informations utiles",ty:"area",ph:"Ex. : Données paracliniques…",full:1}
 ]}
];

/* ===== 2. ÉTAT ===== */
const data = {};
const $ = s => document.querySelector(s);
const RECORDS_KEY = "demarcheSoins.local.records.v1";
const DRAFT_KEY = "demarcheSoins.local.draft.v1";
let currentRecordId = null;
let deferredInstallPrompt = null;

function readJSON(key, fallback){
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : JSON.parse(raw);
}
function makeId(){
  return crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
}
function recordsKey(){ return RECORDS_KEY; }
function draftKey(){ return DRAFT_KEY; }
function readRecords(){ return readJSON(recordsKey(),[]); }
function setAppMessage(text,ok=false,kind=""){
  const m=$("#msg");
  m.textContent=text;
  m.classList.toggle("ok",ok&&!!text);
  if(kind) m.dataset.kind=kind; else delete m.dataset.kind;
}
function migrateActiveAccountData(){
  const userId=sessionStorage.getItem("demarcheSoins.demo.user");
  if(!userId) return;
  try{
    const users=readJSON("demarcheSoins.demo.users.v1",[]);
    if(!Array.isArray(users)||!users.some(user=>user.id===userId)) return;
    const oldRecords=localStorage.getItem(`demarcheSoins.demo.records.${userId}`);
    const oldDraft=localStorage.getItem(`demarcheSoins.demo.draft.${userId}`);
    if(localStorage.getItem(RECORDS_KEY)===null&&oldRecords!==null) localStorage.setItem(RECORDS_KEY,oldRecords);
    if(localStorage.getItem(DRAFT_KEY)===null&&oldDraft!==null) localStorage.setItem(DRAFT_KEY,oldDraft);
  }catch(error){
    setAppMessage(`Les anciens dossiers de démonstration n’ont pas pu être importés : ${error instanceof Error?error.message:"stockage local indisponible"}`);
  }
}

/* ===== 3. AFFICHAGE ===== */
function fieldHTML(f){
  const id = "f_"+f.id, lab = `<label for="${id}" class="${f.req?'req':''}">${f.l}</label>`;
  let c = "";
  if(f.ty==="select") c = `<select id="${id}" data-k="${f.id}"><option value="">Choisir…</option>${f.o.map(o=>`<option>${o}</option>`).join("")}</select>`;
  else if(f.ty==="area") c = `<textarea id="${id}" data-k="${f.id}" ${f.ph?`placeholder="${f.ph}"`:""}></textarea>`;
  else if(f.ty==="yn") return `<div class="fld" data-f="${f.id}"><span class="lab">${f.l}</span><div class="radios">${["Oui","Non"].map(v=>`<label><input type="radio" name="${f.id}" data-k="${f.id}" value="${v}">${v}</label>`).join("")}</div></div>`;
  else if(f.ty==="guide") return `<div class="fld full" data-f="guide"><button type="button" class="btn alt" id="guideBtn">Guide de rédaction</button><div id="guidePanel" class="guide hidden"></div></div>`;
  else if(f.ty==="imc") return `<div class="fld full" data-f="imc"><span class="lab">${f.l}</span><div class="imc" id="imcBox">Renseigner le poids et la taille dans les constantes du jour</div></div>`;
  else c = `<input id="${id}" data-k="${f.id}" type="${f.ty}" ${f.min!=null?`min="${f.min}"`:""} ${f.max!=null?`max="${f.max}"`:""} ${f.step?`step="${f.step}"`:""} ${f.ph?`placeholder="${f.ph}"`:""}>`;
  return `<div class="fld ${f.full?'full':''}" data-f="${f.id}">${lab}${c}</div>`;
}

function build(){
  $("#nav").innerHTML = `<div class="menu-panel">
      <p class="menu-group">Recueil de données</p>
      <button type="button" class="menu-item" data-go="report-header">En-tête du document</button>
      <button type="button" class="menu-item" data-go="general">Renseignements généraux</button>
      <button type="button" class="menu-item" data-go="${S.length}">Données sur les 14 besoins fondamentaux</button>
      <p class="menu-group">Analyse</p>
      <button type="button" class="menu-item" data-go="nonsat-sec">Besoins non satisfaits</button>
      <button type="button" class="menu-item" data-go="relation-sec">Relation entre les éléments</button>
      <button type="button" class="menu-item" data-go="diagnostics-sec">Diagnostics infirmiers</button>
      <p class="menu-group">Planification</p>
      <button type="button" class="menu-item" data-go="objectifs-sec">Objectifs de soins</button>
      <button type="button" class="menu-item" data-go="interventions-sec">Interventions infirmières</button>
      <button type="button" class="menu-item" data-go="pm-sec">Problèmes médicaux</button>
      <button type="button" class="menu-item" data-go="plan-sec">Plan de soins</button>
      <p class="menu-group">Aide</p>
      <button type="button" class="menu-item" data-go="documentation">Documentation</button>
    </div>`;
  $("#form").innerHTML = `<fieldset id="report-header"><legend>En-tête du document</legend><div class="grid">
      <div class="fld"><label for="f_student">Nom de l’étudiant</label><input id="f_student" data-k="student" type="text"></div>
      <div class="fld"><label for="f_school">École</label><input id="f_school" data-k="school" type="text"></div>
      <div class="fld"><label for="f_service">Service</label><input id="f_service" data-k="service" type="text"></div>
      <div class="fld"><label for="f_supervisor">Encadrant</label><input id="f_supervisor" data-k="supervisor" type="text"></div>
      <div class="fld"><label for="f_reportDate">Date</label><input id="f_reportDate" data-k="reportDate" type="date"></div>
    </div></fieldset>`
    +`<fieldset class="general-data"><legend>Renseignements généraux</legend><div class="general-sections">${S.map((s,i)=>
    `<details class="bes section-details" data-s="${i}"><summary><span>${s.t}</span></summary><div class="grid">${s.f.map(fieldHTML).join("")}</div></details>`).join("")}</div></fieldset>`
    +`<fieldset data-s="${S.length}"><legend>Données sur les 14 besoins fondamentaux</legend>${besoinsHTML()}</fieldset>`
    +stepHTML()
    +`<fieldset id="documentation"><legend>Documentation</legend><div class="documentation-content">
      <p>Mode d’emploi rapide :</p>
      <ul>
        <li>Renseignez l’en-tête du document puis les sections ; les champs marqués d’un astérisque (*) sont obligatoires.</li>
        <li>Cliquez sur « Enregistrer le dossier » : il apparaît dans « Dossiers enregistrés ».</li>
        <li>« Exporter le dossier en PDF » ouvre un aperçu en paysage, à imprimer ou à enregistrer.</li>
        <li>Dans « Besoins non satisfaits », examinez les propositions provenant des besoins renseignés ; confirmez seulement celles qui sont réellement non satisfaites.</li>
        <li>Dans « Relation entre les éléments », associez un problème et une cause puis préremplissez un diagnostic réel à compléter avec les signes et symptômes.</li>
        <li>« Sauvegarder (JSON) » crée un fichier de secours de tous les dossiers ; « Restaurer » le recharge.</li>
        <li>Pour l’installation, ouvrez d’abord l’application en ligne avec une adresse HTTPS : utilisez « Installer l’application » quand le bouton apparaît, ou le menu du navigateur (« Installer » / « Ajouter à l’écran d’accueil »). Sur iPhone/iPad, utilisez Safari puis Partager &gt; Sur l’écran d’accueil.</li>
        <li>Une première ouverture avec connexion est nécessaire pour mettre l’application en cache. Ensuite, elle peut s’ouvrir hors ligne sur ce même appareil et dans ce même navigateur.</li>
        <li>Version de démonstration : utilisez uniquement des patients fictifs.</li>
      </ul>
    </div></fieldset>`;
  $("#actions").innerHTML = `<button type="button" class="btn alt" id="exportPdf">Exporter le dossier en PDF</button><button type="button" class="btn" id="save">Enregistrer le dossier</button>`;
  renderLists();
  update();
}
function update(){
  // champs conditionnels
  S.forEach(s=>s.f.forEach(f=>{
    if(f.show){ const n=document.querySelector(`[data-f="${f.id}"]`); n&&n.classList.toggle("hidden",!f.show(data)); }
  }));
  calcIMC();
  renderGuide();
  updateBesoins();
  updateNeedSuggestions();
  updateRelationDiagnosisButtons();
  updateObjLabels();
  updateIntLabels();
  updatePlanLabels();
}
function calcIMC(){
  const box=$("#imcBox"); if(!box) return;
  const p=parseFloat(data.poids), t=parseFloat(data.taille)/100;
  if(!p||!t){ box.textContent="Renseigner le poids et la taille dans les constantes du jour"; data.imc=""; return; }
  const v=p/(t*t); let c,col;
  if(v<18.5){c="Maigreur";col="var(--warn)"} else if(v<25){c="Poids normal";col="var(--ok)"} else if(v<30){c="Surpoids";col="var(--warn)"} else {c="Obésité";col="var(--warn)"}
  data.imc=v.toFixed(1);
  box.innerHTML=`<b>${data.imc}</b> kg/m² <span style="color:${col}">· ${c}</span>`;
}


/* ===== GUIDE DE RÉDACTION : histoire de la maladie ===== */
const GUIDE = [
  ["Mode de début","Quand les symptômes ont-ils commencé ? Début brutal ou progressif ? Dans quelles circonstances ?"],
  ["Évolution des symptômes","Quels symptômes, dans quel ordre, avec quelle intensité ?"],
  ["Admission","Pourquoi consulter à ce moment-là ? Quel était l’état du patient à l’entrée ?"],
  ["Depuis l’hospitalisation","Amélioration ou aggravation ?"]
];
let insTexts = [];
const TODO = "[à compléter]";
function fdate(d){ return d ? d.split("-").reverse().join("/") : TODO; }
function phraseCivil(){
  const f = data.sexe==="Féminin";
  const civ = f ? "Mme" : (data.sexe==="Masculin" ? "M." : "");
  const nom = [civ, data.prenom, data.nom].filter(Boolean).join(" ") || TODO;
  const p = [nom, data.age ? data.age+" ans" : TODO];
  if(data.profession) p.push(data.profession);
  if(data.civil) p.push(data.civil.toLowerCase());
  let s = p.join(", ");
  s += data.ant_med ? ", aux antécédents médicaux de : "+data.ant_med.trim() : ", antécédents médicaux : "+TODO;
  return s+".";
}
function phraseAdmission(){
  const adm = data.sexe==="Féminin" ? "admise" : "admis";
  return `Le patient est ${adm} le ${fdate(data.entree)} dans le service ${data.lieu||TODO} pour ${data.diag||TODO}.`.replace("Le patient", data.sexe==="Féminin" ? "La patiente" : "Le patient");
}
function renderGuide(){
  const box = $("#guidePanel"); if(!box || box.classList.contains("hidden")) return;
  insTexts = [phraseCivil(), phraseAdmission()];
  const vie = [];
  if(data.alcool==="Oui") vie.push("consommation d’alcool");
  if(data.imc) vie.push("IMC "+data.imc);
  box.innerHTML =
    `<p class="lab">Plan conseillé : écris au passé et dans l’ordre chronologique, sans inventer de données.</p>`+
    `<div class="sug"><b>1. Présentation du patient</b><p>${insTexts[0]}</p><button type="button" class="btn alt" data-ins="0">Insérer dans le résumé</button></div>`+
    GUIDE.map((g,i)=>`<div class="sug"><b>${i+2}. ${g[0]}</b><p>${g[1]}</p>`+
      (g[0]==="Admission" ? `<p><i>${insTexts[1]}</i></p><button type="button" class="btn alt" data-ins="1">Insérer dans le résumé</button>` : "")+`</div>`).join("")+
    (vie.length ? `<p class="lab">À mentionner si pertinent : ${vie.join(", ")}.</p>` : "");
}
function insertText(t){
  const el = $("#f_histoire"); if(!el) return;
  el.value = el.value.trim() ? el.value.trim()+"\n\n"+t : t;
  data.histoire = el.value; el.classList.remove("bad"); el.focus();
}


/* ===== 14 BESOINS FONDAMENTAUX : même tableau pour chaque besoin ===== */
const BESOINS = [
  ["respirer","Respirer"],
  ["boire_manger","Boire et manger"],
  ["eliminer","Éliminer les déchets"],
  ["mouvoir","Se mouvoir et maintenir une bonne posture"],
  ["dormir","Dormir et se reposer"],
  ["vetir","Se vêtir et se dévêtir"],
  ["temperature","Maintenir la température du corps dans les limites de la normale"],
  ["hygiene","Être propre et protéger ses téguments"],
  ["dangers","Éviter les dangers"],
  ["communiquer","Communiquer avec ses semblables"],
  ["croyances","Agir selon ses croyances et ses valeurs"],
  ["occuper","S’occuper en vue de se réaliser"],
  ["recreer","Se récréer"],
  ["apprendre","Apprendre"]
];
const ASPECTS = [["bio","Biologique"],["psy","Psychologique"],["socio","Sociologique"]];
const COLS = [
  ["obs","Ce que l’on observe et ce que le client ou l’accompagnant dit"],
  ["dos","Ce que l’on lit dans le dossier médical et ce que les autres membres de l’équipe disent"]
];
/* Pistes d’observation : [biologique, psychologique, sociologique] */
const HINTS = {
  respirer:["Fréquence et rythme respiratoires, SpO₂, toux, expectorations, dyspnée, cyanose, tirage, oxygénothérapie","Anxiété, sensation d’étouffement, peur de manquer d’air","Tabagisme, exposition à la fumée ou à la poussière, aération du logement et du lieu de travail"],
  boire_manger:["Appétit, quantité mangée et bue, mastication, déglutition, nausées, vomissements, état de la bouche, poids, régime prescrit","Plaisir de manger, refus ou compulsion, dégoût, stress lié à l’alimentation","Habitudes et interdits alimentaires, moyens pour s’alimenter, repas seul ou en famille, aide pour manger"],
  eliminer:["Urines (quantité, aspect), selles (fréquence, aspect), constipation, diarrhée, sueurs, sonde urinaire, couche, vomissements","Gêne, pudeur ou honte liées à la sonde, à la couche ou à l’incontinence","Accès aux toilettes, intimité, aide nécessaire pour éliminer"],
  mouvoir:["Mobilité, force musculaire, équilibre, douleur, alitement, posture, aides techniques (canne, fauteuil), risque de chute","Motivation à bouger, peur de tomber ou d’avoir mal","Activité physique habituelle, postures et efforts liés au travail, aide de l’entourage pour se déplacer"],
  dormir:["Durée et qualité du sommeil, réveils nocturnes, somnolence, douleur ou toux gênant le sommeil, traitement sédatif","Anxiété, ruminations, cauchemars, fatigue ressentie","Bruit, lumière, partage de la chambre, rythme de travail, habitudes de sommeil"],
  vetir:["Capacité à s’habiller seul, dextérité, tenue adaptée à la température, vêtements propres, perfusion ou sonde gênant l’habillage","Image de soi, pudeur, souci de l’apparence","Habitudes vestimentaires, tenue liée à la religion ou à la culture, moyens de se vêtir"],
  temperature:["Température, frissons, sueurs, peau chaude ou froide, fièvre, vêtements et couvertures, signes de déshydratation","Sensation de chaud ou de froid, inconfort, inquiétude liée à la fièvre","Chaleur et ventilation de l’environnement, literie disponible, habitudes face à la fièvre"],
  hygiene:["État de la peau (plaies, escarres, rougeurs, œdèmes), hygiène corporelle et buccale, cheveux, ongles, odeurs, autonomie pour la toilette","Image du corps, souci de propreté, pudeur","Habitudes d’hygiène, accès à l’eau et au savon, aide pour la toilette"],
  dangers:["État de conscience, orientation, douleur, risque de chute, risque infectieux (sonde, voie veineuse), allergies, traitements à risque","Peur, agitation, confusion, anxiété, confiance envers l’équipe","Environnement sûr, présence de l’entourage, alcool et tabac, connaissance des risques"],
  communiquer:["Vue, audition, élocution, langage, orientation, état de conscience, expression non verbale","Humeur, émotions exprimées, repli, agressivité, estime de soi, besoin de parler","Langue parlée, entourage et visites, relations avec les soignants, rôle dans la famille"],
  croyances:["Capacité physique à pratiquer sa religion (prier, se déplacer)","Foi, sens donné à la maladie, espoir, angoisse, besoin de soutien spirituel","Religion, pratiques et interdits, visite d’un guide religieux, recours aux soins traditionnels"],
  occuper:["Capacité physique à travailler ou à avoir une activité, fatigue, énergie","Sentiment d’utilité, estime de soi, inquiétude pour le travail et la famille, motivation","Profession, rôle dans la famille, revenus, effet de la maladie sur le travail"],
  recreer:["Énergie et capacité physique pour les loisirs","Ennui, plaisir, humeur, intérêt pour les activités, moral","Loisirs habituels, vie sociale, visites, accès à la radio, à la télévision, au téléphone"],
  apprendre:["Concentration, mémoire, vue, audition, niveau de conscience, fatigue limitant l’apprentissage","Motivation, compréhension de la maladie, anxiété, ouverture à l’éducation","Niveau d’instruction, langue, connaissances sur la maladie et le traitement, rôle de l’entourage"]
};
function besoinsHTML(){
  return BESOINS.map(([id,t],i)=>
    `<details class="bes"><summary><span>${i+1}. ${t}</span><em class="cnt" data-cnt="${id}">0/6</em></summary>`+
    `<div class="bt"><div class="bh"><span>Aspect</span>${COLS.map(c=>`<span>${c[1]}</span>`).join("")}</div>`+
    ASPECTS.map((a,ai)=>`<div class="br"><div class="asp"><b>${a[1]}</b><small>${HINTS[id][ai]}</small></div>`+
      COLS.map(c=>`<div class="bc"><span class="cap">${c[1]}</span><textarea data-k="${id}_${a[0]}_${c[0]}" aria-label="${t} : ${a[1]} : ${c[1]}"></textarea></div>`).join("")+
    `</div>`).join("")+`</div></details>`).join("");
}
function updateBesoins(){
  BESOINS.forEach(([id])=>{
    let n=0;
    ASPECTS.forEach(a=>COLS.forEach(c=>{ if((data[`${id}_${a[0]}_${c[0]}`]||"").trim()) n++; }));
    const el=document.querySelector(`[data-cnt="${id}"]`);
    if(el){ el.textContent=n+"/6"; el.classList.toggle("done",n>0); }
  });
}
function refreshRecords(){
  const list=$("#recordsList");
  list.replaceChildren();
  const records=readRecords();
  if(!Array.isArray(records)) throw new Error("La liste des dossiers locaux est illisible.");
  if(!records.length){
    const empty=document.createElement("p");
    empty.className="empty-records";
    empty.textContent="Aucun dossier enregistré pour le moment.";
    list.append(empty);
    return;
  }
  records.sort((a,b)=>b.savedAt.localeCompare(a.savedAt)).forEach(record=>{
    const row=document.createElement("div");
    row.className="record-row";
    const info=document.createElement("div");
    info.className="record-info";
    const title=document.createElement("strong");
    title.textContent=record.title;
    const date=document.createElement("small");
    date.textContent=`Enregistré le ${new Date(record.savedAt).toLocaleString("fr-FR")}`;
    info.append(title,date);
    const controls=document.createElement("div");
    controls.className="record-actions";
    [["open","Ouvrir"],["pdf","PDF"],["delete","Supprimer"]].forEach(([action,label])=>{
      const button=document.createElement("button");
      button.type="button";
      button.className="btn alt";
      button.dataset.recordAction=action;
      button.dataset.recordId=record.id;
      button.textContent=label;
      controls.append(button);
    });
    row.append(info,controls);
    list.append(row);
  });
}
function saveDraft(){
  try{
    const hasData=Object.keys(data).length>0;
    if(!hasData&&!currentRecordId){
      localStorage.removeItem(draftKey());
      return;
    }
    localStorage.setItem(draftKey(),JSON.stringify({recordId:currentRecordId,data:{...data}}));
    $("#status").textContent="Brouillon sauvegardé automatiquement dans ce navigateur.";
  }catch(error){
    setAppMessage(`Erreur lors de la sauvegarde locale : ${error instanceof Error?error.message:"espace de stockage indisponible"}`);
  }
}
function loadCurrentDraft(){
  try{
    const draft=readJSON(draftKey(),null);
    if(draft&&draft.data&&typeof draft.data==="object") loadIntoForm(draft.data,draft.recordId||null);
    else loadIntoForm({},null);
    refreshRecords();
  }catch(error){
    setAppMessage(`Impossible de charger les dossiers locaux : ${error instanceof Error?error.message:"données illisibles"}`);
  }
}
function loadIntoForm(values,recordId){
  Object.keys(data).forEach(key=>delete data[key]);
  Object.assign(data,values);
  currentRecordId=recordId;
  renderLists();
  $("#form").querySelectorAll("[data-k]").forEach(input=>{
    const value=data[input.dataset.k]||"";
    if(input.type==="radio") input.checked=input.value===value;
    else input.value=value;
    input.classList.remove("bad");
  });
  document.querySelectorAll(".section-details, .bes").forEach(details=>{ details.open=false; });
  $("#out").classList.add("hidden");
  setAppMessage("");
  update();
}
function startNewRecord(){
  loadIntoForm({},null);
  try{ localStorage.removeItem(draftKey()); }
  catch(error){ setAppMessage(`Impossible d’effacer le brouillon : ${error instanceof Error?error.message:"stockage indisponible"}`); }
  $("#form").scrollIntoView({behavior:"smooth"});
}
function openSavedRecord(id){
  try{
    const record=readRecords().find(item=>item.id===id);
    if(!record) throw new Error("Ce dossier n’existe plus dans le stockage local.");
    loadIntoForm(record.data,record.id);
    saveDraft();
    $("#form").scrollIntoView({behavior:"smooth"});
  }catch(error){
    setAppMessage(`Impossible d’ouvrir le dossier : ${error instanceof Error?error.message:"données illisibles"}`);
  }
}
function deleteSavedRecord(id){
  if(!window.confirm("Supprimer définitivement ce dossier de ce navigateur ?")) return;
  try{
    const records=readRecords().filter(record=>record.id!==id);
    localStorage.setItem(recordsKey(),JSON.stringify(records));
    if(currentRecordId===id) startNewRecord();
    refreshRecords();
    setAppMessage("Dossier supprimé de ce navigateur.",true);
  }catch(error){
    setAppMessage(`Impossible de supprimer le dossier : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
}
function addReportSection(report,title,entries){
  const section=document.createElement("section");
  section.className="report-section";
  const heading=document.createElement("h2");
  heading.textContent=title;
  section.append(heading);
  if(!entries.length){
    const empty=document.createElement("p");
    empty.textContent="Aucune donnée renseignée.";
    section.append(empty);
  }else{
    const table=document.createElement("table");
    entries.forEach(([label,value])=>{
      const row=document.createElement("tr");
      const name=document.createElement("th");
      name.scope="row";
      name.textContent=label;
      const content=document.createElement("td");
      content.textContent=value;
      row.append(name,content);
      table.append(row);
    });
    section.append(table);
  }
  report.append(section);
}
function reportTable(report,title,headings,rows){
  const section=document.createElement("section");
  section.className="report-section";
  const heading=document.createElement("h2");
  heading.textContent=title;
  section.append(heading);
  if(!rows.length){
    const empty=document.createElement("p");
    empty.textContent="Aucune donnée renseignée.";
    section.append(empty);
  }else{
    const table=document.createElement("table");
    table.className=`report-grid-table${headings.length===5?" plan-table":""}`;
    const thead=document.createElement("thead");
    const headerRow=document.createElement("tr");
    headings.forEach(label=>{
      const cell=document.createElement("th");
      cell.scope="col";
      cell.textContent=label;
      headerRow.append(cell);
    });
    thead.append(headerRow);
    const tbody=document.createElement("tbody");
    rows.forEach(values=>{
      const row=document.createElement("tr");
      values.forEach(value=>{
        const cell=document.createElement("td");
        cell.textContent=value||"";
        row.append(cell);
      });
      tbody.append(row);
    });
    table.append(thead,tbody);
    section.append(table);
  }
  report.append(section);
}
function showReportPreview(values){
  const report=$("#printReport");
  report.replaceChildren();
  const title=document.createElement("h1");
  title.textContent="Démarche de soins — Dossier patient";
  report.append(title);
  const generated=document.createElement("p");
  generated.className="report-date";
  generated.textContent="Démarche de soins — Document de travail";
  report.append(generated);
  const headerRows=[
    ["Nom de l’étudiant",values.student],
    ["École",values.school],
    ["Service",values.service||values.lieu],
    ["Encadrant",values.supervisor],
    ["Date",values.reportDate?fdate(values.reportDate):""]
  ];
  addReportSection(report,"Informations de présentation",headerRows);
  S.forEach(section=>{
    const entries=section.f.filter(field=>field.ty!=="guide").map(field=>[
      field.l,
      String(field.ty==="imc"?(values.imc||""):(values[field.id]||""))
    ]).filter(([,value])=>value);
    addReportSection(report,section.t,entries);
  });
  BESOINS.forEach(([id,label],index)=>{
    const rows=ASPECTS.map(aspect=>[
      aspect[1],
      values[`${id}_${aspect[0]}_obs`]||"",
      values[`${id}_${aspect[0]}_dos`]||""
    ]).filter(([,observations,dossier])=>observations||dossier);
    reportTable(report,`${index+1}. ${label}`,["Aspect",COLS[0][1],COLS[1][1]],rows);
  });
  const needCount=Math.min(Math.max(parseInt(values.nonsat_n)||1,1),MAX_ROWS);
  const unmetRows=[];
  for(let i=0;i<needCount;i++){
    const need=values[`nonsat_${i}_besoin`]||"";
    const actions=values[`nonsat_${i}_actions`]||"";
    if(need||actions) unmetRows.push([need,actions]);
  }
  reportTable(report,"Besoins non satisfaits",["Besoins non satisfaits","Actions montrant la non-satisfaction"],unmetRows);
  addReportSection(report,"Relation entre les éléments",reportRows(values,"rel"));
  addReportSection(report,"Diagnostics infirmiers : réels ou actuels",reportRows(values,"dreel"));
  addReportSection(report,"Diagnostics infirmiers : à risque ou potentiels",reportRows(values,"drisk"));
  const objectiveRows=[];
  for(let i=0;i<needCount;i++){
    const objective=values[`obj_${i}_txt`]||"";
    const interventions=values[`int_${i}_txt`]||"";
    if(objective||interventions) objectiveRows.push([objective,interventions]);
  }
  reportTable(report,"Objectifs et interventions",["Objectifs de soins","Interventions infirmières"],objectiveRows);
  addReportSection(report,"Problèmes médicaux",reportRows(values,"pm"));
  const planRows=[];
  for(let i=0;i<needCount;i++){
    const date=values[`plan_${i}_date`]||"";
    const need=values[`nonsat_${i}_besoin`]||"";
    const objective=values[`obj_${i}_txt`]||"";
    const interventions=values[`int_${i}_txt`]||"";
    const delegated=values[`plan_${i}_deleg`]||"";
    const evaluationDate=values[`plan_${i}_edate`]?fdt(values[`plan_${i}_edate`]):"";
    const evaluation=values[`plan_${i}_eval`]||"";
    if(date||need||objective||interventions||delegated||evaluationDate||evaluation){
      planRows.push([
        [date?fdt(date):"",need].filter(Boolean).join("\n"),
        objective,
        interventions,
        delegated,
        [evaluationDate,evaluation].filter(Boolean).join("\n")
      ]);
    }
  }
  reportTable(report,"Plan de soins",["Date du plan / besoin non satisfait","Objectif","Interventions infirmières","Soins délégués","Évaluation (date et résultat)"],planRows);
  $("#pdfPreview").classList.remove("hidden");
  $("#pdfPreview").scrollIntoView({behavior:"smooth"});
}
function printReport(){
  const previousTitle=document.title;
  const heading=$("#printReport h1").textContent;
  document.title=`Démarche de soins - ${heading}`;
  window.addEventListener("afterprint",()=>{ document.title=previousTitle; },{once:true});
  window.print();
}
function closeReportPreview(){
  $("#pdfPreview").classList.add("hidden");
  $("#actions").scrollIntoView({behavior:"smooth"});
}
async function installApp(){
  if(!deferredInstallPrompt) return;
  const prompt=deferredInstallPrompt;
  deferredInstallPrompt=null;
  try{
    await prompt.prompt();
    const choice=await prompt.userChoice;
    $("#installApp").classList.add("hidden");
    $("#status").textContent=choice.outcome==="accepted"
      ?"Installation de l’application acceptée."
      :"Installation de l’application annulée.";
  }catch(error){
    setAppMessage(`Impossible de lancer l’installation : ${error instanceof Error?error.message:"erreur inconnue"}`);
  }
}
function enableOfflineApp(){
  if(!window.isSecureContext||!("serviceWorker" in navigator)){
    $("#status").textContent="Pour installer l’application et activer le mode hors ligne, ouvrez-la depuis une adresse HTTPS.";
    return;
  }
  navigator.serviceWorker.register("./sw.js")
    .then(()=>navigator.serviceWorker.ready)
    .then(()=>{ $("#status").textContent="Application prête à fonctionner hors ligne sur cet appareil."; })
    .catch(error=>{
      setAppMessage(`Le mode hors ligne n’a pas pu être activé : ${error instanceof Error?error.message:"erreur inconnue"}`);
    });
}


/* ===== SAUVEGARDE : export / import JSON ===== */
function allowedKeys(){
  const keys=new Set();
  S.forEach(s=>s.f.forEach(f=>{ if(f.ty!=="guide") keys.add(f.id); }));
  ["student","school","service","supervisor","reportDate"].forEach(key=>keys.add(key));
  BESOINS.forEach(([id])=>ASPECTS.forEach(a=>COLS.forEach(c=>keys.add(`${id}_${a[0]}_${c[0]}`))));
  return keys;
}
function exportRecords(){
  try{
    const records=readRecords();
    if(!Array.isArray(records)||!records.length){ setAppMessage("Aucun dossier enregistré à sauvegarder."); return; }
    const payload={app:"demarche-soins",version:1,exportedAt:new Date().toISOString(),records};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`demarche-soins-sauvegarde-${new Date().toISOString().slice(0,10)}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    setAppMessage(`${records.length} dossier(s) sauvegardé(s) dans un fichier.`,true);
  }catch(error){
    setAppMessage(`Sauvegarde impossible : ${error instanceof Error?error.message:"erreur inconnue"}`);
  }
}
function cleanRecord(r){
  if(!r||typeof r!=="object"||typeof r.id!=="string"||!r.id) return null;
  if(typeof r.savedAt!=="string"||isNaN(Date.parse(r.savedAt))) return null;
  if(!r.data||typeof r.data!=="object"||Array.isArray(r.data)) return null;
  const allowed=allowedKeys(), values={};
  Object.keys(r.data).forEach(k=>{ if((allowed.has(k)||DYN_KEY.test(k))&&typeof r.data[k]==="string") values[k]=r.data[k]; });
  const title=typeof r.title==="string"&&r.title.trim()?r.title.trim().slice(0,200):"Dossier sans nom";
  return {id:r.id.slice(0,100),title,data:values,savedAt:r.savedAt};
}
async function importRecords(file){
  try{
    if(file.size>5*1024*1024) throw new Error("fichier trop volumineux (5 Mo maximum).");
    let payload;
    try{ payload=JSON.parse(await file.text()); }
    catch(e){ throw new Error("ce fichier n’est pas un JSON valide."); }
    if(!payload||payload.app!=="demarche-soins"||!Array.isArray(payload.records)) throw new Error("ce fichier n’est pas une sauvegarde de cette application.");
    const current=readRecords();
    if(!Array.isArray(current)) throw new Error("la liste des dossiers locaux est illisible.");
    let added=0,updated=0,ignored=0;
    payload.records.forEach(raw=>{
      const rec=cleanRecord(raw);
      if(!rec){ ignored++; return; }
      const i=current.findIndex(x=>x.id===rec.id);
      if(i<0){ current.push(rec); added++; }
      else if(rec.savedAt>current[i].savedAt){ current[i]=rec; updated++; }
      else ignored++;
    });
    localStorage.setItem(recordsKey(),JSON.stringify(current));
    refreshRecords();
    setAppMessage(`Restauration terminée : ${added} ajouté(s), ${updated} mis à jour, ${ignored} ignoré(s).`,true);
  }catch(error){
    setAppMessage(`Restauration impossible : ${error instanceof Error?error.message:"erreur inconnue"}`);
  }
}


/* ===== LISTES À LIGNES VARIABLES : besoins non satisfaits, relations, diagnostics ===== */
const MAX_ROWS=30;
const DYN_KEY=/^(nonsat|rel|dreel|drisk|obj|int|pm|plan)_(n|\d{1,2}_[a-z]+)$/;
const BESOIN_OPTS=BESOINS.map(([id,t],i)=>`${i+1}. ${t}`);
const DYN={
  nonsat:{add:"Ajouter un besoin",f:[["besoin","Besoin non satisfait","sel"],["actions","Actions montrant la non satisfaction du besoin","area"]]},
  rel:{add:"Ajouter une relation",f:[["prob","Problème","text"],["cause","Cause","text"]]},
  dreel:{add:"Ajouter un diagnostic",f:[["txt","Diagnostic réel ou actuel","area"]]},
  drisk:{add:"Ajouter un diagnostic",f:[["txt","Diagnostic à risque ou potentiel","area"]]},
  pm:{add:"Ajouter un problème médical",f:[["pb","Problème médical","text"],["signes","Signes observables cliniques / biologiques","area"],["cause","Cause","area"],["obj","Objectifs des soins prescrits","area"],["inter","Interventions de soins","area"],["voie","Voie d’administration","text"],["effets","Effets attendus : efficacité clinique / biologique","area"],["second","Effets secondaires à dépister","area"]]}
};
function stepHTML(){
  const grp=g=>`<div data-g="${g}"></div><button type="button" class="btn alt" data-add="${g}">${DYN[g].add}</button>`;
  return `<fieldset id="nonsat-sec"><legend>Besoins non satisfaits</legend><p class="diag-format">Suggestions fondées sur les informations déjà saisies dans les 14 besoins. Une donnée renseignée ne signifie pas automatiquement que le besoin est non satisfait : vérifiez chaque proposition.</p><div class="need-suggestions" data-need-suggestions></div>${grp("nonsat")}</fieldset>`
    +`<fieldset id="relation-sec"><legend>Relation entre les éléments</legend><p class="lab">Associez un problème à sa cause, puis utilisez le bouton pour préparer un diagnostic réel à compléter.</p>${grp("rel")}</fieldset>`
    +`<fieldset id="diagnostics-sec"><legend>Diagnostics infirmiers</legend><h3 class="dyn-h">Réels et actuels</h3><p class="diag-format">Format : [Problème] + lié à + [Étiologie/Cause] + se manifestant par + [Signes et symptômes].</p>${grp("dreel")}<h3 class="dyn-h">À risque ou potentiels</h3><p class="diag-format">Format : [Risque de…] + lié à + [Facteurs de risque].</p>${grp("drisk")}</fieldset>`
    +`<fieldset id="objectifs-sec"><legend>Objectifs de soins</legend><div class="diag-format"><b>Deux formulations possibles :</b><br>[Le patient] + [Verbe d’action au futur] + [Résultat mesurable] + [Échéance/Délai].<br>[Que le patient] + [Verbe d’action au subjonctif] + [Résultat mesurable] + [Échéance/Délai].</div><p class="lab">Prévoir un objectif de soins pour chaque besoin non satisfait.</p><div data-obj></div></fieldset>`
    +`<fieldset id="interventions-sec"><legend>Interventions infirmières</legend><p class="lab">Pour chaque objectif de soins, indiquez les interventions infirmières à réaliser (une par ligne).</p><div data-int></div></fieldset>`
    +`<fieldset id="pm-sec"><legend>Problèmes médicaux</legend><p class="lab">Soins prescrits : un bloc par problème médical.</p>${grp("pm")}</fieldset>`
    +`<fieldset id="plan-sec"><legend>Plan de soins</legend><p class="lab">Un plan par besoin non satisfait. Intégrez les soins délégués dans le plan.</p><div data-plan></div></fieldset>`;
}
function rowCount(g){ return Math.min(Math.max(parseInt(data[g+"_n"])||1,1),MAX_ROWS); }
function renderLists(){
  Object.keys(DYN).forEach(g=>{
    const box=document.querySelector(`[data-g="${g}"]`); if(!box) return;
    const n=rowCount(g);
    box.innerHTML=Array.from({length:n},(_,i)=>`<div class="dyn-row"><div class="dyn-head"><b>${i+1}</b>${n>1?`<button type="button" class="btn alt" data-del="${g}:${i}">Retirer</button>`:""}</div>`
      +DYN[g].f.map(([k,l,ty])=>{
        const key=`${g}_${i}_${k}`, id="f_"+key;
        const ctl=ty==="sel"?`<select id="${id}" data-k="${key}"><option value="">Choisir…</option>${BESOIN_OPTS.map(o=>`<option>${o}</option>`).join("")}</select>`
          :ty==="area"?`<textarea id="${id}" data-k="${key}"></textarea>`:`<input id="${id}" data-k="${key}" type="text">`;
        return `<div class="fld"><label for="${id}">${l}</label>${ctl}</div>`;
      }).join("")+(g==="rel"?`<button type="button" class="btn alt relation-diagnosis" data-diagnosis-from="${i}" disabled>Préremplir un diagnostic réel</button>`:"")+`</div>`).join("");
    box.querySelectorAll("[data-k]").forEach(el=>{ el.value=data[el.dataset.k]||""; });
  });
  updateNeedSuggestions();
  updateRelationDiagnosisButtons();
  renderObjectives();
  renderInterventions();
  renderPlan();
}
function filledNeeds(){
  return BESOINS.filter(([id])=>ASPECTS.some(aspect=>COLS.some(column=>
    String(data[`${id}_${aspect[0]}_${column[0]}`]||"").trim()
  )));
}
function updateNeedSuggestions(){
  const box=document.querySelector("[data-need-suggestions]");
  if(!box) return;
  const selected=new Set();
  for(let i=0;i<rowCount("nonsat");i++){
    const need=data[`nonsat_${i}_besoin`];
    if(need) selected.add(need);
  }
  const suggestions=filledNeeds().filter(([id])=>{
    const index=BESOINS.findIndex(([needId])=>needId===id);
    return !selected.has(`${index+1}. ${BESOINS[index][1]}`);
  });
  box.replaceChildren();
  if(!suggestions.length) return;
  const title=document.createElement("p");
  title.className="suggestion-title";
  title.textContent="Besoins renseignés à examiner :";
  box.append(title);
  suggestions.forEach(([id,label])=>{
    const index=BESOINS.findIndex(([needId])=>needId===id);
    const button=document.createElement("button");
    button.type="button";
    button.className="btn alt need-suggestion";
    button.dataset.suggestNeed=id;
    button.textContent=`Proposer : ${index+1}. ${label}`;
    box.append(button);
  });
}
function proposeNeed(id){
  const needIndex=BESOINS.findIndex(([needId])=>needId===id);
  if(needIndex<0) return;
  const label=`${needIndex+1}. ${BESOINS[needIndex][1]}`;
  const n=rowCount("nonsat");
  for(let i=0;i<n;i++) if(data[`nonsat_${i}_besoin`]===label) return;
  const emptyIndex=Array.from({length:n},(_,i)=>i).find(i=>
    DYN.nonsat.f.every(([key])=>!String(data[`nonsat_${i}_${key}`]||"").trim())
  );
  const targetIndex=emptyIndex===undefined?n:emptyIndex;
  if(targetIndex>=MAX_ROWS){
    setAppMessage(`Le nombre maximal de besoins (${MAX_ROWS}) est atteint.`);
    return;
  }
  if(targetIndex===n) data.nonsat_n=String(n+1);
  data[`nonsat_${targetIndex}_besoin`]=label;
  renderLists();
  update();
  saveDraft();
}
function updateRelationDiagnosisButtons(){
  document.querySelectorAll("[data-diagnosis-from]").forEach(button=>{
    const i=button.dataset.diagnosisFrom;
    button.disabled=!(String(data[`rel_${i}_prob`]||"").trim()&&String(data[`rel_${i}_cause`]||"").trim());
  });
}
function createDiagnosisFromRelation(index){
  const problem=String(data[`rel_${index}_prob`]||"").trim();
  const cause=String(data[`rel_${index}_cause`]||"").trim();
  if(!problem||!cause) return;
  const diagnosis=`${problem} lié à ${cause}, se manifestant par [signes et symptômes à compléter]`;
  const n=rowCount("dreel");
  const existingIndex=Array.from({length:n},(_,i)=>i).find(i=>!String(data[`dreel_${i}_txt`]||"").trim());
  if(existingIndex===undefined&&n>=MAX_ROWS){
    setAppMessage(`Le nombre maximal de diagnostics (${MAX_ROWS}) est atteint.`);
    return;
  }
  const targetIndex=existingIndex===undefined?n:existingIndex;
  if(targetIndex===n) data.dreel_n=String(n+1);
  data[`dreel_${targetIndex}_txt`]=diagnosis;
  renderLists();
  update();
  saveDraft();
  const target=document.getElementById(`f_dreel_${targetIndex}_txt`);
  target?.scrollIntoView({behavior:"smooth",block:"center"});
  target?.focus({preventScroll:true});
}
function addRow(g){
  const n=rowCount(g); if(n>=MAX_ROWS) return;
  data[g+"_n"]=String(n+1); renderLists(); saveDraft();
}
function delRow(g,idx){
  const n=rowCount(g), i=parseInt(idx); if(n<2||isNaN(i)) return;
  for(let j=i;j<n-1;j++) DYN[g].f.forEach(([k])=>{ data[`${g}_${j}_${k}`]=data[`${g}_${j+1}_${k}`]||""; });
  DYN[g].f.forEach(([k])=>{ delete data[`${g}_${n-1}_${k}`]; });
  if(g==="nonsat"){
    for(let j=i;j<n-1;j++) data[`obj_${j}_txt`]=data[`obj_${j+1}_txt`]||"";
    delete data[`obj_${n-1}_txt`];
    for(let j=i;j<n-1;j++) data[`int_${j}_txt`]=data[`int_${j+1}_txt`]||"";
    delete data[`int_${n-1}_txt`];
    ["date","deleg","edate","eval"].forEach(k=>{
      for(let j=i;j<n-1;j++) data[`plan_${j}_${k}`]=data[`plan_${j+1}_${k}`]||"";
      delete data[`plan_${n-1}_${k}`];
    });
  }
  data[g+"_n"]=String(n-1); renderLists(); saveDraft();
}
function reportRows(values,g){
  const n=Math.min(Math.max(parseInt(values[g+"_n"])||1,1),MAX_ROWS), out=[];
  for(let i=0;i<n;i++) DYN[g].f.forEach(([k,l])=>{
    const v=values[`${g}_${i}_${k}`]; if(v) out.push([n>1?`${i+1}. ${l}`:l,v]);
  });
  return out;
}


/* ===== OBJECTIFS DE SOINS : un objectif par besoin non satisfait ===== */
function renderObjectives(){
  const box=document.querySelector("[data-obj]"); if(!box) return;
  const n=rowCount("nonsat");
  box.innerHTML=Array.from({length:n},(_,i)=>`<div class="dyn-row"><div class="dyn-head"><b class="obj-label" data-i="${i}"></b></div><div class="fld"><label for="f_obj_${i}_txt">Objectif de soins</label><textarea id="f_obj_${i}_txt" data-k="obj_${i}_txt"></textarea></div></div>`).join("");
  box.querySelectorAll("[data-k]").forEach(el=>{ el.value=data[el.dataset.k]||""; });
  updateObjLabels();
}
function updateObjLabels(){
  document.querySelectorAll(".obj-label").forEach(el=>{
    const i=el.dataset.i;
    el.textContent=data[`nonsat_${i}_besoin`]||`Besoin non précisé (ligne ${+i+1})`;
  });
}
function reportObjectives(values){
  const n=Math.min(Math.max(parseInt(values.nonsat_n)||1,1),MAX_ROWS), out=[];
  for(let i=0;i<n;i++){
    const v=values[`obj_${i}_txt`];
    if(v) out.push([values[`nonsat_${i}_besoin`]||`Besoin ${i+1}`,v]);
  }
  return out;
}


/* ===== INTERVENTIONS INFIRMIÈRES : une zone par objectif de soins ===== */
function renderInterventions(){
  const box=document.querySelector("[data-int]"); if(!box) return;
  const n=rowCount("nonsat");
  box.innerHTML=Array.from({length:n},(_,i)=>`<div class="dyn-row"><div class="dyn-head"><b class="int-label" data-i="${i}"></b></div><p class="lab int-obj" data-i="${i}"></p><div class="fld"><label for="f_int_${i}_txt">Interventions</label><textarea id="f_int_${i}_txt" data-k="int_${i}_txt"></textarea></div></div>`).join("");
  box.querySelectorAll("[data-k]").forEach(el=>{ el.value=data[el.dataset.k]||""; });
  updateIntLabels();
}
function updateIntLabels(){
  document.querySelectorAll(".int-label").forEach(el=>{
    el.textContent=data[`nonsat_${el.dataset.i}_besoin`]||`Besoin non précisé (ligne ${+el.dataset.i+1})`;
  });
  document.querySelectorAll(".int-obj").forEach(el=>{
    el.textContent="Objectif : "+(data[`obj_${el.dataset.i}_txt`]||"non renseigné");
  });
}
function reportInterventions(values){
  const n=Math.min(Math.max(parseInt(values.nonsat_n)||1,1),MAX_ROWS), out=[];
  for(let i=0;i<n;i++){
    const b=values[`nonsat_${i}_besoin`]||`Besoin ${i+1}`;
    if(values[`obj_${i}_txt`]) out.push([`Objectif : ${b}`,values[`obj_${i}_txt`]]);
    if(values[`int_${i}_txt`]) out.push([`Interventions : ${b}`,values[`int_${i}_txt`]]);
  }
  return out;
}


/* ===== PLAN DE SOINS : un plan par besoin non satisfait ===== */
function renderPlan(){
  const box=document.querySelector("[data-plan]"); if(!box) return;
  const n=rowCount("nonsat");
  box.innerHTML=Array.from({length:n},(_,i)=>{
    const f=(k,l,ty,full)=>{
      const id=`f_plan_${i}_${k}`, key=`plan_${i}_${k}`;
      const ctl=ty==="area"?`<textarea id="${id}" data-k="${key}"></textarea>`:`<input id="${id}" data-k="${key}" type="datetime-local">`;
      return `<div class="fld${full?" full":""}"><label for="${id}">${l}</label>${ctl}</div>`;
    };
    return `<div class="dyn-row"><div class="dyn-head"><b class="plan-label" data-i="${i}"></b></div><p class="lab plan-recap" data-i="${i}"></p><div class="grid">${f("date","Date et heure du plan")}${f("edate","Date et heure de l’évaluation")}${f("deleg","Soins délégués (à intégrer au plan)","area",1)}${f("eval","Évaluation","area",1)}</div></div>`;
  }).join("");
  box.querySelectorAll("[data-k]").forEach(el=>{ el.value=data[el.dataset.k]||""; });
  updatePlanLabels();
}
function updatePlanLabels(){
  document.querySelectorAll(".plan-label").forEach(el=>{
    el.textContent=data[`nonsat_${el.dataset.i}_besoin`]||`Besoin non précisé (ligne ${+el.dataset.i+1})`;
  });
  document.querySelectorAll(".plan-recap").forEach(el=>{
    const i=el.dataset.i;
    el.textContent="Objectif : "+(data[`obj_${i}_txt`]||"non renseigné")+"\nInterventions : "+(data[`int_${i}_txt`]||"non renseignées");
  });
}
function fdt(v){ if(!v) return ""; const [d,t]=v.split("T"); return d.split("-").reverse().join("/")+(t?" "+t:""); }
function reportPlan(values){
  const n=Math.min(Math.max(parseInt(values.nonsat_n)||1,1),MAX_ROWS), out=[];
  for(let i=0;i<n;i++){
    const b=values[`nonsat_${i}_besoin`]||`Besoin ${i+1}`, g=k=>values[`plan_${i}_${k}`]||"";
    [["Date du plan",fdt(g("date"))],["Objectif",values[`obj_${i}_txt`]||""],["Interventions",values[`int_${i}_txt`]||""],["Soins délégués",g("deleg")],["Date de l’évaluation",fdt(g("edate"))],["Évaluation",g("eval")]]
      .forEach(([l,v])=>{ if(v) out.push([`${b} : ${l}`,v]); });
  }
  return out;
}

/* ===== 4. ÉVÉNEMENTS ===== */
document.addEventListener("input",e=>{
  const k=e.target.dataset&&e.target.dataset.k; if(!k) return;
  data[k]=e.target.value; e.target.classList.remove("bad");
  update();
  saveDraft();
  refreshValidation();
});
document.addEventListener("click",e=>{
  const recordButton=e.target.closest("[data-record-action]");
  if(recordButton){
    if(recordButton.dataset.recordAction==="open") openSavedRecord(recordButton.dataset.recordId);
    else if(recordButton.dataset.recordAction==="pdf"){
      try{
        const record=readRecords().find(item=>item.id===recordButton.dataset.recordId);
        if(record) showReportPreview(record.data);
        else setAppMessage("Ce dossier n’existe plus dans le stockage local.");
      }catch(error){
        setAppMessage(`Impossible de lire le dossier : ${error instanceof Error?error.message:"données illisibles"}`);
      }
    }
    else if(recordButton.dataset.recordAction==="delete") deleteSavedRecord(recordButton.dataset.recordId);
    return;
  }
  if(e.target.closest("#newRecord")){
    if(Object.keys(data).length&&!window.confirm("Commencer un nouveau dossier ? Le brouillon actuel sera effacé, mais les dossiers déjà enregistrés resteront disponibles.")) return;
    startNewRecord();
    return;
  }
  if(e.target.closest("#exportRecords")){ exportRecords(); return; }
  if(e.target.closest("#importRecords")){ $("#importFile").click(); return; }
  if(e.target.closest("#installApp")){ installApp(); return; }
  const suggestedNeed=e.target.closest("[data-suggest-need]");
  if(suggestedNeed){ proposeNeed(suggestedNeed.dataset.suggestNeed); return; }
  const diagnosisButton=e.target.closest("[data-diagnosis-from]");
  if(diagnosisButton){ createDiagnosisFromRelation(diagnosisButton.dataset.diagnosisFrom); return; }
  if(e.target.closest("#exportPdf")){
    if(validateData()) showReportPreview({...data});
    return;
  }
  if(e.target.closest("#closePreview")){ closeReportPreview(); return; }
  if(e.target.closest("#savePreviewPdf")||e.target.closest("#printPreview")){ printReport(); return; }
  const menuToggle=e.target.closest("#menuToggle");
  if(menuToggle){
    const open=menuToggle.getAttribute("aria-expanded")!=="true";
    $("#nav").classList.toggle("hidden",!open);
    menuToggle.setAttribute("aria-expanded",String(open));
    menuToggle.setAttribute("aria-label",open?"Fermer le menu de navigation":"Ouvrir le menu de navigation");
    return;
  }
  if(!e.target.closest("#nav")){
    $("#nav").classList.add("hidden");
    $("#menuToggle").setAttribute("aria-expanded","false");
    $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  }
  const t=e.target.closest("button");
  if(!t) return;
  if(t.dataset.go!==undefined){
    const section=t.dataset.go==="general"
      ? $(".general-data")
      : t.dataset.go==="report-header"
        ? $("#report-header")
      : t.dataset.go==="documentation"
        ? $("#documentation")
      : /-sec$/.test(t.dataset.go)
        ? document.getElementById(t.dataset.go)
      : +t.dataset.go<S.length
        ? document.querySelector(`.section-details[data-s="${t.dataset.go}"]`)
        : document.querySelector(`fieldset[data-s="${t.dataset.go}"]`);
    if(section.matches(".section-details")) section.open=true;
    $("#nav").classList.add("hidden");
    $("#menuToggle").setAttribute("aria-expanded","false");
    $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
    section.scrollIntoView({behavior:"smooth"});
  }
  else if(t.dataset.add) addRow(t.dataset.add);
  else if(t.dataset.del) delRow(...t.dataset.del.split(":"));
  else if(t.id==="guideBtn"){ $("#guidePanel").classList.toggle("hidden"); renderGuide(); }
  else if(t.dataset.ins!==undefined) insertText(insTexts[+t.dataset.ins]);
  else if(t.id==="save") save();
});

function missingFields(){
  const missing=[];
  S.forEach(s=>s.f.forEach(f=>{ if(f.req && !data[f.id]) missing.push(f); }));
  return missing;
}
function missingMessage(missing){ return "Champs obligatoires manquants : "+missing.map(f=>f.l).join(", ")+"."; }
function refreshValidation(){
  if($("#msg").dataset.kind!=="validation") return;
  const missing=missingFields();
  if(missing.length) setAppMessage(missingMessage(missing),false,"validation");
  else setAppMessage("");
}
function validateData(){
  const missing=missingFields();
  document.querySelectorAll(".bad").forEach(n=>n.classList.remove("bad"));
  if(missing.length){
    missing.forEach(f=>{const el=document.getElementById("f_"+f.id); el&&el.classList.add("bad");});
    setAppMessage(missingMessage(missing),false,"validation");
    const firstField=missing[0];
    const section=S.findIndex(section=>section.f.includes(firstField));
    if(section>=0){
      const details=document.querySelector(`.section-details[data-s="${section}"]`);
      details.open=true;
      details.scrollIntoView({behavior:"smooth"});
      document.getElementById("f_"+firstField.id).focus();
    }
    return false;
  }
  setAppMessage("");
  return true;
}
function save(){
  if(!validateData()) return;
  try{
    const records=readRecords();
    if(!Array.isArray(records)) throw new Error("La liste des dossiers locaux est illisible.");
    const savedAt=new Date().toISOString();
    const title=[data.prenom,data.nom].filter(Boolean).join(" ")||"Dossier sans nom";
    const existingIndex=records.findIndex(record=>record.id===currentRecordId);
    const record={id:currentRecordId||makeId(),title,data:{...data},savedAt};
    if(existingIndex>=0) records[existingIndex]=record;
    else records.push(record);
    localStorage.setItem(recordsKey(),JSON.stringify(records));
    currentRecordId=record.id;
    localStorage.setItem(draftKey(),JSON.stringify({recordId:currentRecordId,data:{...data}}));
    refreshRecords();
    setAppMessage("Dossier enregistré dans ce navigateur.",true);
  }catch(error){
    setAppMessage(`Impossible d’enregistrer le dossier : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
}
document.addEventListener("change",e=>{
  if(e.target.id!=="importFile") return;
  const file=e.target.files&&e.target.files[0];
  if(file) importRecords(file);
  e.target.value="";
});
window.addEventListener("beforeinstallprompt",event=>{
  event.preventDefault();
  deferredInstallPrompt=event;
  $("#installApp").classList.remove("hidden");
});
window.addEventListener("appinstalled",()=>{
  deferredInstallPrompt=null;
  $("#installApp").classList.add("hidden");
  $("#status").textContent="Application installée sur cet appareil.";
});
migrateActiveAccountData();
build();
loadCurrentDraft();
enableOfflineApp();
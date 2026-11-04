import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { NavigationMenu } from "./src/NavigationMenu.jsx";
import { WizardScreen } from "./src/WizardScreen.jsx";
import { ReportPreview } from "./src/ReportPreview.jsx";
import {
  addUserRecords,
  deleteUserRecord,
  listUserRecords,
  saveUserRecord,
  subscribeToAuth,
  supabaseConfigured
} from "./src/lib/supabase.js";

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
const APPEARANCE_KEY = "demarcheSoins.appearance.v1";
let currentRecordId = null;
let deferredInstallPrompt = null;
let currentWizardStep = 0;
let navigationCloseTimer = null;
let navigationRoot = null;
let navigationResetKey = 0;
let wizardRoot = null;
let reportRoot = null;
let currentUser = null;
let visibleRecords = [];
let authUnsubscribe = null;
const WIZARD_STEPS = [
  {title:"Recueil",description:"Rassemblez les renseignements généraux et les données sur les besoins fondamentaux."},
  {title:"Analyse",description:"Repérez les besoins non satisfaits, établissez les liens et formulez les diagnostics."},
  {title:"Planification",description:"Définissez les objectifs, les interventions et le plan de soins."},
  {title:"Finalisation",description:"Relisez les consignes, enregistrez le dossier ou préparez son export PDF."}
];

function applyAppearance(appearance){
  const root=document.documentElement;
  if(appearance==="system") delete root.dataset.theme;
  else root.dataset.theme=appearance;
  const dark=appearance==="dark"||(appearance==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);
  const themeColor=document.querySelector('meta[name="theme-color"]');
  if(themeColor) themeColor.content=dark?"#0a6683":"#0b7a9e";
}
function initializeAppearance(){
  let appearance="system";
  try{
    const saved=localStorage.getItem(APPEARANCE_KEY);
    if(saved==="light"||saved==="dark"||saved==="system") appearance=saved;
  }catch(error){
    setAppMessage(`Impossible de charger la préférence d’apparence : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
  applyAppearance(appearance);
  updateAppearanceMenu(appearance);
}
function saveAppearance(appearance){
  if(!["system","light","dark"].includes(appearance)) return;
  applyAppearance(appearance);
  updateAppearanceMenu(appearance);
  try{
    localStorage.setItem(APPEARANCE_KEY,appearance);
  }catch(error){
    setAppMessage(`L’apparence a changé, mais la préférence n’a pas pu être enregistrée : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
}
function updateAppearanceMenu(appearance){
  document.querySelectorAll("[data-appearance]").forEach(button=>{
    const selected=button.dataset.appearance===appearance;
    button.setAttribute("aria-pressed",String(selected));
  });
}
function closeAppearanceMenu(){
  document.querySelectorAll(".appearance-menu").forEach(menu=>menu.classList.add("hidden"));
  document.querySelectorAll("[data-appearance-toggle]").forEach(button=>button.setAttribute("aria-expanded","false"));
}
function closeNavigationMenu({restoreFocus=false}={}){
  const nav=$("#nav");
  if(navigationCloseTimer) window.clearTimeout(navigationCloseTimer);
  nav.classList.remove("is-open");
  nav.inert=true;
  nav.setAttribute("aria-hidden","true");
  if(navigationRoot) navigationRoot.render(createElement(NavigationMenu,{key:++navigationResetKey}));
  navigationCloseTimer=window.setTimeout(()=>{
    if(!nav.classList.contains("is-open")) nav.classList.add("hidden");
    navigationCloseTimer=null;
  },360);
  $("#menuToggle").setAttribute("aria-expanded","false");
  $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  if(restoreFocus) $("#menuToggle").focus();
}
function closeLandingNavigation({restoreFocus=false}={}){
  $("#landingNav").classList.remove("is-open");
  $("#landingMenuToggle").setAttribute("aria-expanded","false");
  $("#landingMenuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  if(restoreFocus) $("#landingMenuToggle").focus();
}
async function setRecordsView(show){
  if(show){
    try{
      await refreshRecords();
    }catch(error){
      setAppMessage(`Impossible de charger les dossiers : ${error instanceof Error?error.message:"données illisibles"}`);
    }
  }
  window.dispatchEvent(new CustomEvent("demarche:view",{detail:{view:show?"records":"app"}}));
  window.scrollTo({top:0,behavior:"auto"});
}
function readJSON(key, fallback){
  const raw = localStorage.getItem(key);
  return raw === null ? fallback : JSON.parse(raw);
}
function makeId(){
  return crypto.randomUUID ? crypto.randomUUID() : Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,"0")).join("");
}
function recordsKey(){ return currentUser ? `${RECORDS_KEY}.${currentUser.id}` : RECORDS_KEY; }
function draftKey(){ return currentUser ? `${DRAFT_KEY}.${currentUser.id}` : DRAFT_KEY; }
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
function initializeCloudSync(){
  if(!supabaseConfigured||authUnsubscribe) return;
  authUnsubscribe=subscribeToAuth(({event,user})=>{
    const previousUserId=currentUser?.id||null;
    currentUser=user;
    window.dispatchEvent(new CustomEvent("demarche:account-updated",{detail:{user}}));
    if(previousUserId===user?.id&&event!=="INITIAL_SESSION") return;
    window.setTimeout(()=>{
      if(currentUser?.id!==user?.id) return;
      if(previousUserId!==user?.id) loadCurrentDraft();
      else refreshRecords().catch(error=>{
          setAppMessage(`Impossible de charger les dossiers : ${error instanceof Error?error.message:"erreur de stockage"}`);
        });
    },0);
  });
}

/* ===== 3. AFFICHAGE ===== */
function build(){
  $("#nav").inert=true;
  $("#nav").setAttribute("aria-hidden","true");
  navigationRoot=createRoot($("#nav"));
  navigationRoot.render(createElement(NavigationMenu));
  setupWizard();
  update();
}
function setupWizard(){
  wizardRoot=createRoot($("#form"));
  const formProps={
    schema:S,
    needs:BESOINS,
    aspects:ASPECTS,
    columns:COLS,
    hints:HINTS,
    dynamic:DYN,
    data:{...data},
    onChange:(key,value)=>{
      data[key]=value;
      const field=document.querySelector(`[data-k="${CSS.escape(key)}"]`);
      field?.classList.remove("bad");
      update();
      saveDraft();
      refreshValidation();
    },
    filledNeeds
  };
  wizardRoot.render(createElement(WizardScreen,{
    steps:WIZARD_STEPS,
    formProps,
    actions:[
      createElement("button",{type:"button",className:"btn alt",id:"exportPdf",key:"export"},"Exporter le dossier en PDF"),
      createElement("button",{type:"button",className:"btn",id:"save",key:"save"},"Enregistrer le dossier")
    ],
    onStepChange:setWizardStep
  }));
  setWizardStep(0,{scroll:false});
}
function setWizardStep(index,{scroll=true}={}){
  if(!Number.isInteger(index)||index<0||index>=WIZARD_STEPS.length) return;
  currentWizardStep=index;
  window.dispatchEvent(new CustomEvent("demarche:wizard-step",{detail:{index}}));
  if(scroll) requestAnimationFrame(()=>$("#form").scrollIntoView({behavior:"smooth",block:"start"}));
}
function update(){
  calcIMC();
  insTexts=[phraseCivil(),phraseAdmission()];
  window.dispatchEvent(new CustomEvent("demarche:data-updated",{detail:{data:{...data}}}));
}
function calcIMC(){
  const p=parseFloat(data.poids), t=parseFloat(data.taille)/100;
  data.imc=p>0&&t>0?(p/(t*t)).toFixed(1):"";
}


/* ===== GUIDE DE RÉDACTION : histoire de la maladie ===== */
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
function insertText(t){
  const el = $("#f_histoire"); if(!el) return;
  data.histoire = data.histoire&&data.histoire.trim() ? data.histoire.trim()+"\n\n"+t : t;
  update();
  saveDraft();
  refreshValidation();
  el.classList.remove("bad");
  el.focus();
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
async function refreshRecords(){
  if(currentUser){
    const userId=currentUser.id;
    try{
      const records=await listUserRecords(userId);
      if(currentUser?.id!==userId) return;
      visibleRecords=records;
      try{
        localStorage.setItem(recordsKey(),JSON.stringify(records));
        $("#status").textContent="Dossiers synchronisés avec votre compte Supabase.";
      }catch(error){
        $("#status").textContent=`Dossiers chargés depuis Supabase, mais la copie hors ligne n’a pas pu être enregistrée : ${error instanceof Error?error.message:"stockage indisponible"}`;
      }
    }catch(error){
      if(currentUser?.id!==userId) return;
      const cached=readRecords();
      if(!Array.isArray(cached)) throw new Error("La liste des dossiers hors ligne est illisible.");
      visibleRecords=cached.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
      $("#status").textContent=`Synchronisation indisponible : affichage de la copie locale. ${error instanceof Error?error.message:"erreur réseau"}`;
    }
  }else{
    const records=readRecords();
    if(!Array.isArray(records)) throw new Error("La liste des dossiers locaux est illisible.");
    visibleRecords=records.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
  }
  window.dispatchEvent(new CustomEvent("demarche:records-updated",{detail:{records:visibleRecords}}));
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
    refreshRecords().catch(error=>{
      setAppMessage(`Impossible de charger les dossiers : ${error instanceof Error?error.message:"données illisibles"}`);
    });
  }catch(error){
    setAppMessage(`Impossible de charger les dossiers locaux : ${error instanceof Error?error.message:"données illisibles"}`);
  }
}
function loadIntoForm(values,recordId){
  Object.keys(data).forEach(key=>delete data[key]);
  Object.assign(data,values);
  currentRecordId=recordId;
  document.querySelectorAll(".section-details, .bes").forEach(details=>{ details.open=false; });
  $("#out").classList.add("hidden");
  setAppMessage("");
  setWizardStep(0,{scroll:false});
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
    const record=visibleRecords.find(item=>item.id===id)||readRecords().find(item=>item.id===id);
    if(!record) throw new Error("Ce dossier n’existe plus dans le stockage local.");
    loadIntoForm(record.data,record.id);
    saveDraft();
    setRecordsView(false);
    $("#form").scrollIntoView({behavior:"smooth"});
  }catch(error){
    setAppMessage(`Impossible d’ouvrir le dossier : ${error instanceof Error?error.message:"données illisibles"}`);
  }
}
async function deleteSavedRecord(id){
  if(!window.confirm("Supprimer définitivement ce dossier de ce navigateur ?")) return;
  try{
    if(currentUser) await deleteUserRecord(id,currentUser.id);
    const records=readRecords().filter(record=>record.id!==id);
    localStorage.setItem(recordsKey(),JSON.stringify(records));
    if(currentRecordId===id) startNewRecord();
    await refreshRecords();
    setAppMessage(currentUser?"Dossier supprimé de votre compte.":"Dossier supprimé de ce navigateur.",true);
  }catch(error){
    setAppMessage(`Impossible de supprimer le dossier : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
}
function showReportPreview(values){
  const sections=S.map(section=>({
    title:section.t,
    entries:section.f.filter(field=>field.ty!=="guide").map(field=>[
      field.l,
      String(field.ty==="imc"?(values.imc||""):(values[field.id]||""))
    ]).filter(([,value])=>value)
  }));
  const needSections=BESOINS.map(([id,label],index)=>({
    title:`${index+1}. ${label}`,
    headings:["Aspect",COLS[0][1],COLS[1][1]],
    rows:ASPECTS.map(aspect=>[
      aspect[1],
      values[`${id}_${aspect[0]}_obs`]||"",
      values[`${id}_${aspect[0]}_dos`]||""
    ]).filter(([,observations,dossier])=>observations||dossier)
  }));
  const needCount=Math.min(Math.max(parseInt(values.nonsat_n)||1,1),MAX_ROWS);
  const unmetRows=[];
  for(let i=0;i<needCount;i++){
    const need=values[`nonsat_${i}_besoin`]||"";
    const actions=values[`nonsat_${i}_actions`]||"";
    if(need||actions) unmetRows.push([need,actions]);
  }
  const objectiveRows=[];
  for(let i=0;i<needCount;i++){
    const objective=values[`obj_${i}_txt`]||"";
    const interventions=values[`int_${i}_txt`]||"";
    if(objective||interventions) objectiveRows.push([objective,interventions]);
  }
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
  if(!reportRoot) reportRoot=createRoot($("#printReport"));
  reportRoot.render(createElement(ReportPreview,{
    title:"Démarche de soins — Dossier patient",
    identity:[["Nom de l’étudiant",values.student],["École",values.school]],
    sections,
    needSections,
    unmetRows,
    relationshipRows:reportRows(values,"rel"),
    realDiagnosisRows:reportRows(values,"dreel"),
    riskDiagnosisRows:reportRows(values,"drisk"),
    objectiveRows,
    medicalRows:reportRows(values,"pm"),
    planRows,
    headings:["Date du plan / besoin non satisfait","Objectif","Interventions infirmières","Soins délégués","Évaluation (date et résultat)"]
  }));
  $("#pdfPreview").classList.remove("hidden");
  $("#pdfPreview").scrollIntoView({behavior:"smooth"});
}
function printReport(){
  const previousTitle=document.title;
  document.title="Démarche de soins - Dossier patient";
  window.addEventListener("afterprint",()=>{ document.title=previousTitle; },{once:true});
  window.print();
}
function closeReportPreview(){
  $("#pdfPreview").classList.add("hidden");
  $(".wizard-actions").scrollIntoView({behavior:"smooth"});
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
  if(import.meta.env.DEV){
    $("#status").textContent="Mode développement : le mode hors ligne est activé dans la version publiée.";
    return;
  }
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
    const records=currentUser?visibleRecords:readRecords();
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
    const current=readJSON(RECORDS_KEY,[]);
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
    localStorage.setItem(RECORDS_KEY,JSON.stringify(current));
    if(!currentUser) await refreshRecords();
    setAppMessage(currentUser
      ?`Restauration terminée dans ce navigateur : ${added} ajouté(s), ${updated} mis à jour, ${ignored} ignoré(s). Utilisez « Importer les dossiers locaux dans mon compte » pour les synchroniser.`
      :`Restauration terminée : ${added} ajouté(s), ${updated} mis à jour, ${ignored} ignoré(s).`,true);
  }catch(error){
    setAppMessage(`Restauration impossible : ${error instanceof Error?error.message:"erreur inconnue"}`);
  }
}
async function importLocalRecordsToAccount(){
  if(!currentUser) return;
  try{
    const localRecords=readJSON(RECORDS_KEY,[]);
    if(!Array.isArray(localRecords)) throw new Error("La liste des dossiers locaux est illisible.");
    const remoteRecords=await listUserRecords(currentUser.id);
    const remoteIds=new Set(remoteRecords.map(record=>record.id));
    const pending=localRecords.map(cleanRecord).filter(record=>record&&!remoteIds.has(record.id));
    const added=await addUserRecords(pending,currentUser.id);
    await refreshRecords();
    setAppMessage(`${added} dossier(s) local(aux) importé(s) dans votre compte. Les dossiers déjà présents n’ont pas été remplacés.`,true);
  }catch(error){
    setAppMessage(`Import vers Supabase impossible : ${error instanceof Error?error.message:"erreur inconnue"}`);
  }
}


/* ===== LISTES À LIGNES VARIABLES : besoins non satisfaits, relations, diagnostics ===== */
const MAX_ROWS=30;
const DYN_KEY=/^(nonsat|rel|dreel|drisk|obj|int|pm|plan)_(n|\d{1,2}_[a-z]+)$/;
const DYN={
  nonsat:{add:"Ajouter un besoin",f:[["besoin","Besoin non satisfait","sel"],["actions","Actions montrant la non satisfaction du besoin","area"]]},
  rel:{add:"Ajouter une relation",f:[["prob","Problème","text"],["cause","Cause","text"]]},
  dreel:{add:"Ajouter un diagnostic",f:[["txt","Diagnostic réel ou actuel","area"]]},
  drisk:{add:"Ajouter un diagnostic",f:[["txt","Diagnostic à risque ou potentiel","area"]]},
  pm:{add:"Ajouter un problème médical",f:[["pb","Problème médical","text"],["signes","Signes observables cliniques / biologiques","area"],["cause","Cause","area"],["obj","Objectifs des soins prescrits","area"],["inter","Interventions de soins","area"],["voie","Voie d’administration","text"],["effets","Effets attendus : efficacité clinique / biologique","area"],["second","Effets secondaires à dépister","area"]]}
};
function rowCount(g){ return Math.min(Math.max(parseInt(data[g+"_n"])||1,1),MAX_ROWS); }
function filledNeeds(){
  return BESOINS.filter(([id])=>ASPECTS.some(aspect=>COLS.some(column=>
    String(data[`${id}_${aspect[0]}_${column[0]}`]||"").trim()
  )));
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
  update();
  saveDraft();
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
  update();
  saveDraft();
  const target=document.getElementById(`f_dreel_${targetIndex}_txt`);
  target?.scrollIntoView({behavior:"smooth",block:"center"});
  target?.focus({preventScroll:true});
}
function addRow(g){
  const n=rowCount(g); if(n>=MAX_ROWS) return;
  data[g+"_n"]=String(n+1); update(); saveDraft();
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
  data[g+"_n"]=String(n-1); update(); saveDraft();
}
function reportRows(values,g){
  const n=Math.min(Math.max(parseInt(values[g+"_n"])||1,1),MAX_ROWS), out=[];
  for(let i=0;i<n;i++) DYN[g].f.forEach(([k,l])=>{
    const v=values[`${g}_${i}_${k}`]; if(v) out.push([n>1?`${i+1}. ${l}`:l,v]);
  });
  return out;
}


/* ===== OBJECTIFS DE SOINS : un objectif par besoin non satisfait ===== */
function fdt(v){ if(!v) return ""; const [d,t]=v.split("T"); return d.split("-").reverse().join("/")+(t?" "+t:""); }

/* ===== 4. ÉVÉNEMENTS ===== */
document.addEventListener("click",e=>{
  if(e.target.closest("[data-open-app]")){
    closeLandingNavigation();
    window.dispatchEvent(new CustomEvent("demarche:view",{detail:{view:"app"}}));
    window.scrollTo({top:0,behavior:"auto"});
    return;
  }
  const landingMenuToggle=e.target.closest("#landingMenuToggle");
  if(landingMenuToggle){
    const open=landingMenuToggle.getAttribute("aria-expanded")!=="true";
    $("#landingNav").classList.toggle("is-open",open);
    landingMenuToggle.setAttribute("aria-expanded",String(open));
    landingMenuToggle.setAttribute("aria-label",open?"Fermer le menu de navigation":"Ouvrir le menu de navigation");
    return;
  }
  if($("#landingNav").classList.contains("is-open")&&!e.target.closest("#landingNav")&&!e.target.closest("#landingMenuToggle")) closeLandingNavigation();
  if(e.target.closest("#landingNav a")) closeLandingNavigation();
  if(e.target.closest("#backHome")){
    closeNavigationMenu();
    window.dispatchEvent(new CustomEvent("demarche:view",{detail:{view:"landing"}}));
    window.scrollTo({top:0,behavior:"auto"});
    return;
  }
  const recordButton=e.target.closest("[data-record-action]");
  if(recordButton){
    if(recordButton.dataset.recordAction==="open") openSavedRecord(recordButton.dataset.recordId);
    else if(recordButton.dataset.recordAction==="pdf"){
      try{
        const record=visibleRecords.find(item=>item.id===recordButton.dataset.recordId)||readRecords().find(item=>item.id===recordButton.dataset.recordId);
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
    setRecordsView(false);
    $("#form").scrollIntoView({behavior:"smooth"});
    return;
  }
  if(e.target.closest("#backToForm")){ setRecordsView(false); return; }
  if(e.target.closest("#exportRecords")){ exportRecords(); return; }
  if(e.target.closest("#importRecords")){ $("#importFile").click(); return; }
  if(e.target.closest("#syncLocalRecords")){ importLocalRecordsToAccount(); return; }
  if(e.target.closest("#installApp")){ installApp(); return; }
  const appearanceToggle=e.target.closest("[data-appearance-toggle]");
  if(appearanceToggle){
    const menu=document.getElementById(appearanceToggle.getAttribute("aria-controls"));
    const open=menu.classList.contains("hidden");
    closeAppearanceMenu();
    menu.classList.toggle("hidden",!open);
    appearanceToggle.setAttribute("aria-expanded",String(open));
    return;
  }
  const appearanceOption=e.target.closest("[data-appearance]");
  if(appearanceOption){
    saveAppearance(appearanceOption.dataset.appearance);
    closeAppearanceMenu();
    return;
  }
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
    closeAppearanceMenu();
    const open=menuToggle.getAttribute("aria-expanded")!=="true";
    const nav=$("#nav");
    if(open){
      if(navigationCloseTimer){
        window.clearTimeout(navigationCloseTimer);
        navigationCloseTimer=null;
      }
      nav.classList.remove("hidden");
      nav.inert=false;
      nav.setAttribute("aria-hidden","false");
      void nav.offsetHeight;
      nav.classList.add("is-open");
    }else closeNavigationMenu();
    menuToggle.setAttribute("aria-expanded",String(open));
    menuToggle.setAttribute("aria-label",open?"Fermer le menu de navigation":"Ouvrir le menu de navigation");
    return;
  }
  if(e.target.id==="nav"){
    closeNavigationMenu({restoreFocus:true});
    return;
  }
  if(!e.target.closest("#nav")){
    closeNavigationMenu();
  }
  if(!e.target.closest(".appearance-menu")&&!e.target.closest("[data-appearance-toggle]")) closeAppearanceMenu();
  const t=e.target.closest("button");
  if(!t) return;
  if(t.dataset.view==="records"){
    closeNavigationMenu();
    setRecordsView(true);
    return;
  }
  if(t.dataset.go!==undefined){
    const section=t.dataset.go==="general"
      ? $(".general-data")
      : t.dataset.go==="documentation"
        ? $("#documentation")
      : t.dataset.go==="needs"
        ? document.querySelector(`fieldset[data-s="${S.length}"]`)
      : /-sec$/.test(t.dataset.go)
        ? document.getElementById(t.dataset.go)
      : +t.dataset.go<S.length
        ? document.querySelector(`.section-details[data-s="${t.dataset.go}"]`)
        : document.querySelector(`fieldset[data-s="${t.dataset.go}"]`);
    const wizardStage=section.closest(".wizard-stage");
    if(wizardStage) setWizardStep(Number(wizardStage.dataset.wizardStep),{scroll:false});
    if(section.matches(".section-details")) section.open=true;
    closeNavigationMenu();
    section.scrollIntoView({behavior:"smooth"});
  }
  else if(t.dataset.add) addRow(t.dataset.add);
  else if(t.dataset.del) delRow(...t.dataset.del.split(":"));
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
      setWizardStep(0,{scroll:false});
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
async function save(){
  if(!validateData()) return;
  let localSaved=false;
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
    localSaved=true;
    currentRecordId=record.id;
    localStorage.setItem(draftKey(),JSON.stringify({recordId:currentRecordId,data:{...data}}));
    if(currentUser){
      await saveUserRecord(record,currentUser.id);
      await refreshRecords();
      setAppMessage("Dossier enregistré et synchronisé avec votre compte Supabase.",true);
    }else{
      await refreshRecords();
      setAppMessage("Dossier enregistré dans ce navigateur.",true);
    }
  }catch(error){
    if(currentUser&&localSaved){
      visibleRecords=readRecords();
      window.dispatchEvent(new CustomEvent("demarche:records-updated",{detail:{records:visibleRecords}}));
      setAppMessage(`Le dossier est conservé localement, mais la synchronisation Supabase a échoué : ${error instanceof Error?error.message:"erreur inconnue"}`);
    }else{
      setAppMessage(`Impossible d’enregistrer le dossier : ${error instanceof Error?error.message:"stockage indisponible"}`);
    }
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
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    const openAppearance=document.querySelector(".appearance-menu:not(.hidden)");
    const openNavigation=!$("#nav").classList.contains("hidden");
    if(openAppearance){
      const toggle=document.querySelector(`[aria-controls="${openAppearance.id}"]`);
      closeAppearanceMenu();
      toggle.focus();
    }else if($("#landingNav").classList.contains("is-open")) closeLandingNavigation({restoreFocus:true});
    else if(openNavigation) closeNavigationMenu({restoreFocus:true});
  }
});
export function initializeLegacyApp(){
  migrateActiveAccountData();
  initializeAppearance();
  loadCurrentDraft();
  build();
  initializeCloudSync();
  enableOfflineApp();
}
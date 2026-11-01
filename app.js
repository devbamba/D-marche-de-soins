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
function setAppMessage(text){ $("#msg").textContent=text; }
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
      <button type="button" class="menu-item menu-heading" data-go="general">Renseignements généraux</button>
      <button type="button" class="menu-item menu-heading" data-go="${S.length}">Données sur les 14 besoins fondamentaux</button>
      <button type="button" class="menu-item menu-heading" data-go="documentation">Documentation</button>
    </div>`;
  $("#form").innerHTML = `<fieldset class="general-data"><legend>Renseignements généraux</legend><div class="general-sections">${S.map((s,i)=>
    `<details class="bes section-details" data-s="${i}"><summary><span>${s.t}</span></summary><div class="grid">${s.f.map(fieldHTML).join("")}</div></details>`).join("")}</div></fieldset>`
    +`<fieldset data-s="${S.length}"><legend>Données sur les 14 besoins fondamentaux</legend>${besoinsHTML()}</fieldset>`
    +`<fieldset id="documentation"><legend>Documentation</legend><div class="documentation-content">
      Coming soooooooonnnnn.......
    </div></fieldset>`;
  $("#actions").innerHTML = `<button type="button" class="btn alt" id="exportPdf">Exporter le dossier en PDF</button><button type="button" class="btn" id="save">Enregistrer le dossier</button>`;
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
    setAppMessage("Brouillon sauvegardé automatiquement dans ce navigateur.");
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
    setAppMessage("Dossier supprimé de ce navigateur.");
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
function showReportPreview(values){
  const report=$("#printReport");
  report.replaceChildren();
  const title=document.createElement("h1");
  title.textContent="Démarche de soins — Dossier patient";
  report.append(title);
  const generated=document.createElement("p");
  generated.className="report-date";
  generated.textContent=`Document généré le ${new Date().toLocaleString("fr-FR")} — Démonstration avec données fictives`;
  report.append(generated);
  S.forEach(section=>{
    const entries=section.f.filter(field=>field.ty!=="guide").map(field=>[
      field.l,
      String(field.ty==="imc"?(values.imc||""):(values[field.id]||""))
    ]).filter(([,value])=>value);
    addReportSection(report,section.t,entries);
  });
  BESOINS.forEach(([id,label],index)=>{
    const entries=[];
    ASPECTS.forEach(aspect=>COLS.forEach(column=>{
      const value=values[`${id}_${aspect[0]}_${column[0]}`];
      if(value) entries.push([`${aspect[1]} — ${column[1]}`,value]);
    }));
    addReportSection(report,`${index+1}. ${label}`,entries);
  });
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

/* ===== 4. ÉVÉNEMENTS ===== */
document.addEventListener("input",e=>{
  const k=e.target.dataset&&e.target.dataset.k; if(!k) return;
  data[k]=e.target.value; e.target.classList.remove("bad");
  update();
  saveDraft();
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
      : t.dataset.go==="documentation"
        ? $("#documentation")
      : +t.dataset.go<S.length
        ? document.querySelector(`.section-details[data-s="${t.dataset.go}"]`)
        : document.querySelector(`fieldset[data-s="${t.dataset.go}"]`);
    if(section.matches(".section-details")) section.open=true;
    section.scrollIntoView({behavior:"smooth"});
    $("#nav").classList.add("hidden");
    $("#menuToggle").setAttribute("aria-expanded","false");
    $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  }
  else if(t.id==="guideBtn"){ $("#guidePanel").classList.toggle("hidden"); renderGuide(); }
  else if(t.dataset.ins!==undefined) insertText(insTexts[+t.dataset.ins]);
  else if(t.id==="save") save();
});

function validateData(){
  const missing=[];
  S.forEach(s=>s.f.forEach(f=>{ if(f.req && !data[f.id]) missing.push(f); }));
  document.querySelectorAll(".bad").forEach(n=>n.classList.remove("bad"));
  if(missing.length){
    missing.forEach(f=>{const el=document.getElementById("f_"+f.id); el&&el.classList.add("bad");});
    $("#msg").textContent="Champs obligatoires manquants : "+missing.map(f=>f.l).join(", ")+".";
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
    setAppMessage("Dossier enregistré dans ce navigateur.");
  }catch(error){
    setAppMessage(`Impossible d’enregistrer le dossier : ${error instanceof Error?error.message:"stockage indisponible"}`);
  }
}
migrateActiveAccountData();
build();
loadCurrentDraft();
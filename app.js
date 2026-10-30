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
  $("#nav").innerHTML = `<button type="button" class="menu-toggle" id="menuToggle" aria-expanded="false" aria-controls="menuPanel" aria-label="Ouvrir le menu de navigation"><span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span></button>
    <nav id="menuPanel" class="menu-panel hidden" aria-label="Navigation principale">
      <button type="button" class="menu-item menu-heading" data-go="general">RENSEIGNEMENTS GENERAUX</button>
      <button type="button" class="menu-item menu-heading" data-go="${S.length}">DONNÉES SUR LES 14 BESOINS FONDAMENTAUX</button>
    </nav>`;
  $("#form").innerHTML = `<fieldset class="general-data"><legend>RENSEIGNEMENTS GENERAUX</legend><div class="general-sections">${S.map((s,i)=>
    `<details class="bes section-details" data-s="${i}"><summary><span>${s.t}</span></summary><div class="grid">${s.f.map(fieldHTML).join("")}</div></details>`).join("")}</div></fieldset>`
    +`<fieldset data-s="${S.length}"><legend>DONNÉES SUR LES 14 BESOINS FONDAMENTAUX</legend>${besoinsHTML()}</fieldset>`;
  $("#actions").innerHTML = `<span></span><button class="btn" id="save">Enregistrer</button>`;
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
    `<details class="bes" ${i===0?"open":""}><summary><span>${i+1}. ${t}</span><em class="cnt" data-cnt="${id}">0/6</em></summary>`+
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

/* ===== 4. ÉVÉNEMENTS ===== */
document.addEventListener("input",e=>{
  const k=e.target.dataset&&e.target.dataset.k; if(!k) return;
  data[k]=e.target.value; e.target.classList.remove("bad");
  update();
});
document.addEventListener("click",e=>{
  const menuToggle=e.target.closest("#menuToggle");
  if(menuToggle){
    const open=menuToggle.getAttribute("aria-expanded")!=="true";
    $("#menuPanel").classList.toggle("hidden",!open);
    menuToggle.setAttribute("aria-expanded",String(open));
    menuToggle.setAttribute("aria-label",open?"Fermer le menu de navigation":"Ouvrir le menu de navigation");
    return;
  }
  if(!e.target.closest("#nav")){
    $("#menuPanel").classList.add("hidden");
    $("#menuToggle").setAttribute("aria-expanded","false");
    $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  }
  const t=e.target.closest("button");
  if(!t) return;
  if(t.dataset.go!==undefined){
    const section=t.dataset.go==="general"
      ? $(".general-data")
      : +t.dataset.go<S.length
        ? document.querySelector(`.section-details[data-s="${t.dataset.go}"]`)
        : document.querySelector(`fieldset[data-s="${t.dataset.go}"]`);
    if(section.matches(".section-details")) section.open=true;
    section.scrollIntoView({behavior:"smooth"});
    $("#menuPanel").classList.add("hidden");
    $("#menuToggle").setAttribute("aria-expanded","false");
    $("#menuToggle").setAttribute("aria-label","Ouvrir le menu de navigation");
  }
  else if(t.id==="guideBtn"){ $("#guidePanel").classList.toggle("hidden"); renderGuide(); }
  else if(t.dataset.ins!==undefined) insertText(insTexts[+t.dataset.ins]);
  else if(t.id==="save") save();
});

function save(){
  const missing=[];
  S.forEach(s=>s.f.forEach(f=>{ if(f.req && !data[f.id]) missing.push(f); }));
  document.querySelectorAll(".bad").forEach(n=>n.classList.remove("bad"));
  if(missing.length){
    missing.forEach(f=>{const el=document.getElementById("f_"+f.id); el&&el.classList.add("bad");});
    $("#msg").textContent="Champs obligatoires manquants : "+missing.map(f=>f.l).join(", ")+".";
    return;
  }
  $("#msg").textContent="";
  const out=$("#out"); out.classList.remove("hidden"); out.textContent=JSON.stringify(data,null,2);
  out.scrollIntoView({behavior:"smooth"});
}
build();
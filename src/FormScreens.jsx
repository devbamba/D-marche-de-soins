import { useState } from "react";

function Progress({ label, filled, total, unit = "champs" }) {
  const count = total ? `${Math.min(filled, total)}/${total} ${unit}` : `0 ${unit}`;
  return (
    <em
      className={`progress-badge${total > 0 && filled === total ? " is-complete" : ""}${filled > 0 && filled < total ? " is-started" : ""}`}
      aria-label={`${label} : ${count}`}
    >
      {count}
    </em>
  );
}

function Field({ field, data, onChange, idPrefix = "f_" }) {
  const id = `${idPrefix}${field.id}`;
  const hidden = field.show && !field.show(data);
  const update = event => onChange(field.id, event.target.value);
  if (field.ty === "guide") {
    return <Guide data={data} />;
  }
  if (field.ty === "imc") {
    const weight = Number.parseFloat(data.poids);
    const height = Number.parseFloat(data.taille) / 100;
    const imc = weight > 0 && height > 0 ? weight / (height * height) : null;
    const category = imc === null ? "" : imc < 18.5 ? "Maigreur" : imc < 25 ? "Poids normal" : imc < 30 ? "Surpoids" : "Obésité";
    return (
      <div className={`fld full${hidden ? " hidden" : ""}`} data-f={field.id}>
        <span className="lab">{field.l}</span>
        <div className="imc" id="imcBox">
          {imc === null ? "Renseigner le poids et la taille dans les constantes du jour" : <><b>{imc.toFixed(1)}</b> kg/m² <span>· {category}</span></>}
        </div>
      </div>
    );
  }
  if (field.ty === "yn") {
    return (
      <div className={`fld${hidden ? " hidden" : ""}`} data-f={field.id}>
        <span className="lab">{field.l}</span>
        <div className="radios">
          {["Oui", "Non"].map(value => (
            <label key={value}><input type="radio" name={field.id} data-k={field.id} value={value} checked={data[field.id] === value} onChange={update} />{value}</label>
          ))}
        </div>
      </div>
    );
  }
  const control = field.ty === "select" ? (
    <select id={id} data-k={field.id} value={data[field.id] || ""} onChange={update}>
      <option value="">Choisir…</option>
      {field.o.map(option => <option key={option} value={option}>{option}</option>)}
    </select>
  ) : field.ty === "area" ? (
    <textarea id={id} data-k={field.id} placeholder={field.ph || ""} value={data[field.id] || ""} onChange={update} />
  ) : (
    <input
      id={id}
      data-k={field.id}
      type={field.ty}
      min={field.min}
      max={field.max}
      step={field.step}
      placeholder={field.ph || ""}
      value={data[field.id] || ""}
      onChange={update}
    />
  );
  return (
    <div className={`fld${field.full ? " full" : ""}${hidden ? " hidden" : ""}`} data-f={field.id}>
      <label htmlFor={id} className={field.req ? "req" : ""}>{field.l}</label>
      {control}
    </div>
  );
}

function Guide({ data }) {
  const [open, setOpen] = useState(false);
  const [showFirst, showAdmission] = [
    [data.sexe === "Féminin" ? "Mme" : data.sexe === "Masculin" ? "M." : "", data.prenom, data.nom].filter(Boolean).join(" ") || "[à compléter]",
    data.age ? `${data.age} ans` : "[à compléter]",
  ];
  const patient = [showFirst, showAdmission, data.profession, data.civil?.toLowerCase(), data.ant_med ? `antécédents médicaux : ${data.ant_med.trim()}` : "antécédents médicaux : [à compléter]"].filter(Boolean).join(", ") + ".";
  const admission = `Le patient est ${data.sexe === "Féminin" ? "admise" : "admis"} le ${data.entree ? data.entree.split("-").reverse().join("/") : "[à compléter]"} dans le service ${data.lieu || "[à compléter]"} pour ${data.diag || "[à compléter]"}.`.replace("Le patient", data.sexe === "Féminin" ? "La patiente" : "Le patient");
  return (
    <div className="fld full" data-f="guide">
      <button type="button" className="btn alt" id="guideBtn" aria-expanded={open} onClick={() => setOpen(value => !value)}>Guide de rédaction</button>
      {open && (
        <div id="guidePanel" className="guide">
          <p className="lab">Plan conseillé : écris au passé et dans l’ordre chronologique, sans inventer de données.</p>
          <div className="sug"><b>1. Présentation du patient</b><p>{patient}</p><button type="button" className="btn alt" data-ins="0">Insérer dans le résumé</button></div>
          {[
            ["Mode de début", "Quand les symptômes ont-ils commencé ? Début brutal ou progressif ? Dans quelles circonstances ?"],
            ["Évolution des symptômes", "Quels symptômes, dans quel ordre, avec quelle intensité ?"],
            ["Admission", "Pourquoi consulter à ce moment-là ? Quel était l’état du patient à l’entrée ?"],
            ["Depuis l’hospitalisation", "Amélioration ou aggravation ?"],
          ].map(([title, text], index) => (
            <div className="sug" key={title}>
              <b>{index + 2}. {title}</b><p>{text}</p>
              {title === "Admission" && <><p><i>{admission}</i></p><button type="button" className="btn alt" data-ins="1">Insérer dans le résumé</button></>}
            </div>
          ))}
          {(data.alcool === "Oui" || data.imc) && <p className="lab">À mentionner si pertinent : {[data.alcool === "Oui" && "consommation d’alcool", data.imc && `IMC ${data.imc}`].filter(Boolean).join(", ")}.</p>}
        </div>
      )}
    </div>
  );
}

function GeneralData({ schema, data, onChange }) {
  let total = 0;
  let filled = 0;
  schema.forEach(section => section.f.filter(field => field.ty !== "guide" && (!field.show || field.show(data))).forEach(field => {
    total += 1;
    if (String(data[field.id] || "").trim()) filled += 1;
  }));
  return (
    <fieldset className="general-data">
      <legend>Renseignements généraux <Progress label="Renseignements généraux" filled={filled} total={total} /></legend>
      <div className="general-sections">
        {schema.map((section, index) => {
          const fields = section.f.filter(field => !field.show || field.show(data));
          const count = fields.filter(field => field.ty !== "guide" && String(data[field.id] || "").trim()).length;
          const countable = fields.filter(field => field.ty !== "guide").length;
          return (
            <details className="bes section-details" data-s={index} key={section.id}>
              <summary><span>{section.t}</span><Progress label={section.t} filled={count} total={countable} /></summary>
              <div className="grid">{section.f.map(field => <Field key={field.id} field={field} data={data} onChange={onChange} />)}</div>
            </details>
          );
        })}
      </div>
    </fieldset>
  );
}

function Needs({ needs, aspects, columns, hints, data, onChange, sectionIndex }) {
  const filledNeeds = needs.filter(([id]) => aspects.some(aspect => columns.some(column => String(data[`${id}_${aspect[0]}_${column[0]}`] || "").trim())));
  return (
    <fieldset data-s={sectionIndex}>
      <legend>Données sur les 14 besoins fondamentaux <Progress label="Données sur les 14 besoins" filled={filledNeeds.length} total={needs.length} unit="besoins" /></legend>
      {needs.map(([id, title], index) => {
        const filled = aspects.reduce((sum, aspect) => sum + columns.filter(column => String(data[`${id}_${aspect[0]}_${column[0]}`] || "").trim()).length, 0);
        return (
          <details className="bes" key={id}>
            <summary><span>{index + 1}. {title}</span><em className={`cnt${filled === 6 ? " done" : filled > 0 ? " partial" : ""}`}>{filled}/6</em></summary>
            <div className="bt">
              <div className="bh"><span>Aspect</span>{columns.map(column => <span key={column[0]}>{column[1]}</span>)}</div>
              {aspects.map((aspect, aspectIndex) => (
                <div className="br" key={aspect[0]}>
                  <div className="asp"><b>{aspect[1]}</b><small>{hints[id][aspectIndex]}</small></div>
                  {columns.map(column => {
                    const key = `${id}_${aspect[0]}_${column[0]}`;
                    return <div className="bc" key={column[0]}><span className="cap">{column[1]}</span><textarea data-k={key} aria-label={`${title} : ${aspect[1]} : ${column[1]}`} value={data[key] || ""} onChange={event => onChange(key, event.target.value)} /></div>;
                  })}
                </div>
              ))}
            </div>
          </details>
        );
      })}
    </fieldset>
  );
}

function RowField({ id, label, type, value, onChange, options }) {
  const fieldId = `f_${id}`;
  return (
    <div className="fld">
      <label htmlFor={fieldId}>{label}</label>
      {type === "area" ? <textarea id={fieldId} data-k={id} value={value || ""} onChange={event => onChange(id, event.target.value)} /> :
        type === "sel" ? <select id={fieldId} data-k={id} value={value || ""} onChange={event => onChange(id, event.target.value)}><option value="">Choisir…</option>{options.map(option => <option key={option} value={option}>{option}</option>)}</select> :
          <input id={fieldId} data-k={id} type={type === "datetime" ? "datetime-local" : "text"} value={value || ""} onChange={event => onChange(id, event.target.value)} />}
    </div>
  );
}

function DynamicGroup({ name, config, count, data, onChange, needs }) {
  const options = needs.map(([id, title], index) => `${index + 1}. ${title}`);
  return (
    <div>
      <div data-g={name}>
        {Array.from({ length: count }, (_, index) => (
          <div className="dyn-row" key={`${name}-${index}`}>
            <div className="dyn-head"><b>{index + 1}</b>{count > 1 && <button type="button" className="btn alt" data-del={`${name}:${index}`}>Retirer</button>}</div>
            {config.f.map(([key, label, type]) => {
              const id = `${name}_${index}_${key}`;
              return <RowField key={key} id={id} label={label} type={type} value={data[id]} onChange={onChange} options={options} />;
            })}
            {name === "rel" && <button type="button" className="btn alt relation-diagnosis" data-diagnosis-from={index} disabled={!(String(data[`rel_${index}_prob`] || "").trim() && String(data[`rel_${index}_cause`] || "").trim())}>Préremplir un diagnostic réel</button>}
          </div>
        ))}
      </div>
      <button type="button" className="btn alt" data-add={name}>{config.add}</button>
    </div>
  );
}

function PlanningRows({ count, data, onChange, kind, needs }) {
  return Array.from({ length: count }, (_, index) => {
    const need = data[`nonsat_${index}_besoin`] || `Besoin non précisé (ligne ${index + 1})`;
    const label = kind === "objective" ? "Objectif de soins" : "Interventions";
    const key = `${kind === "objective" ? "obj" : "int"}_${index}_txt`;
    return (
      <div className="dyn-row" key={`${kind}-${index}`}>
        <div className="dyn-head"><b>{need}</b></div>
        {kind === "intervention" && <p className="lab">Objectif : {data[`obj_${index}_txt`] || "non renseigné"}</p>}
        <RowField id={key} label={label} type="area" value={data[key]} onChange={onChange} options={needs} />
      </div>
    );
  });
}

function CarePlan({ count, data, onChange }) {
  return Array.from({ length: count }, (_, index) => (
    <div className="dyn-row" key={`plan-${index}`}>
      <div className="dyn-head"><b>{data[`nonsat_${index}_besoin`] || `Besoin non précisé (ligne ${index + 1})`}</b></div>
      <p className="lab">Objectif : {data[`obj_${index}_txt`] || "non renseigné"}{"\n"}Interventions : {data[`int_${index}_txt`] || "non renseignées"}</p>
      <div className="grid">
        <RowField id={`plan_${index}_date`} label="Date et heure du plan" type="datetime" value={data[`plan_${index}_date`]} onChange={onChange} options={[]} />
        <RowField id={`plan_${index}_edate`} label="Date et heure de l’évaluation" type="datetime" value={data[`plan_${index}_edate`]} onChange={onChange} options={[]} />
        <div className="fld full"><RowField id={`plan_${index}_deleg`} label="Soins délégués (à intégrer au plan)" type="area" value={data[`plan_${index}_deleg`]} onChange={onChange} options={[]} /></div>
        <div className="fld full"><RowField id={`plan_${index}_eval`} label="Évaluation" type="area" value={data[`plan_${index}_eval`]} onChange={onChange} options={[]} /></div>
      </div>
    </div>
  ));
}

function countRows(data, group) {
  return Math.min(Math.max(Number.parseInt(data[`${group}_n`], 10) || 1, 1), 30);
}

export function FormScreens({ stage, schema, needs, aspects, columns, hints, dynamic, data, onChange, filledNeeds }) {
  if (stage === 0) {
    return <><GeneralData schema={schema} data={data} onChange={onChange} /><Needs needs={needs} aspects={aspects} columns={columns} hints={hints} data={data} onChange={onChange} sectionIndex={schema.length} /></>;
  }
  if (stage === 1) {
    const count = countRows(data, "nonsat");
    const selected = new Set(Array.from({ length: count }, (_, index) => data[`nonsat_${index}_besoin`]).filter(Boolean));
    const suggestions = filledNeeds().filter(([id]) => !selected.has(`${needs.findIndex(([needId]) => needId === id) + 1}. ${needs.find(([needId]) => needId === id)?.[1]}`));
    return <>
      <fieldset id="nonsat-sec"><legend>Besoins non satisfaits</legend><p className="diag-format">Suggestions fondées sur les informations déjà saisies dans les 14 besoins. Une donnée renseignée ne signifie pas automatiquement que le besoin est non satisfait : vérifiez chaque proposition.</p>
        <div className="need-suggestions" data-need-suggestions>{suggestions.length > 0 && <><p className="suggestion-title">Besoins renseignés à examiner :</p>{suggestions.map(([id, title]) => <button key={id} type="button" className="btn alt need-suggestion" data-suggest-need={id}>Proposer : {needs.findIndex(([needId]) => needId === id) + 1}. {title}</button>)}</>}</div>
        <DynamicGroup name="nonsat" config={dynamic.nonsat} count={count} data={data} onChange={onChange} needs={needs} />
      </fieldset>
      <fieldset id="relation-sec"><legend>Relation entre les éléments</legend><p className="lab">Associez un problème à sa cause, puis utilisez le bouton pour préparer un diagnostic réel à compléter.</p><DynamicGroup name="rel" config={dynamic.rel} count={countRows(data, "rel")} data={data} onChange={onChange} needs={needs} /></fieldset>
      <fieldset id="diagnostics-sec"><legend>Diagnostics infirmiers</legend><h3 className="dyn-h">Réels et actuels</h3><p className="diag-format">Format : [Problème] + lié à + [Étiologie/Cause] + se manifestant par + [Signes et symptômes].</p><DynamicGroup name="dreel" config={dynamic.dreel} count={countRows(data, "dreel")} data={data} onChange={onChange} needs={needs} /><h3 className="dyn-h">À risque ou potentiels</h3><p className="diag-format">Format : [Risque de…] + lié à + [Facteurs de risque].</p><DynamicGroup name="drisk" config={dynamic.drisk} count={countRows(data, "drisk")} data={data} onChange={onChange} needs={needs} /></fieldset>
    </>;
  }
  if (stage === 2) {
    const count = countRows(data, "nonsat");
    const missingObjectives = Array.from({ length: count }, (_, index) => index).filter(index => data[`nonsat_${index}_besoin`] && !String(data[`obj_${index}_txt`] || "").trim()).map(index => data[`nonsat_${index}_besoin`]);
    return <>
      <fieldset id="objectifs-sec"><legend>Objectifs de soins</legend><div className="diag-format"><b>Deux formulations possibles :</b><br />[Le patient] + [Verbe d’action au futur] + [Résultat mesurable] + [Échéance/Délai].<br />[Que le patient] + [Verbe d’action au subjonctif] + [Résultat mesurable] + [Échéance/Délai].</div><p className="lab">Prévoir un objectif de soins pour chaque besoin non satisfait.</p><div className={`objective-alert${missingObjectives.length ? "" : " hidden"}`} data-objective-alert role="alert" aria-live="polite">{missingObjectives.length ? `Objectif à renseigner pour ${missingObjectives.length === 1 ? "ce besoin" : "ces besoins"} non satisfait${missingObjectives.length === 1 ? "" : "s"} : ${missingObjectives.join(" ; ")}.` : ""}</div><div data-obj><PlanningRows count={count} data={data} onChange={onChange} kind="objective" needs={needs} /></div></fieldset>
      <fieldset id="interventions-sec"><legend>Interventions infirmières</legend><p className="lab">Pour chaque objectif de soins, indiquez les interventions infirmières à réaliser (une par ligne).</p><div data-int><PlanningRows count={count} data={data} onChange={onChange} kind="intervention" needs={needs} /></div></fieldset>
      <fieldset id="pm-sec"><legend>Problèmes médicaux</legend><p className="lab">Soins prescrits : un bloc par problème médical.</p><DynamicGroup name="pm" config={dynamic.pm} count={countRows(data, "pm")} data={data} onChange={onChange} needs={needs} /></fieldset>
      <fieldset id="plan-sec"><legend>Plan de soins</legend><p className="lab">Un plan par besoin non satisfait. Intégrez les soins délégués dans le plan.</p><div data-plan><CarePlan count={count} data={data} onChange={onChange} /></div></fieldset>
    </>;
  }
  return <fieldset id="documentation"><legend>Documentation</legend><div className="documentation-content">
    <p>Mode d’emploi rapide :</p><ul>
      <li>Renseignez les données du patient et les sections ; les champs marqués d’un astérisque (*) sont obligatoires.</li>
      <li>Suivez les quatre étapes avec les boutons « Continuer » et « Précédent » ; vous pouvez aussi utiliser les étapes en haut pour naviguer directement.</li>
      <li>Les indicateurs affichent le nombre de champs renseignés par section ; une alerte signale les besoins non satisfaits sans objectif.</li>
      <li>Cliquez sur « Enregistrer le dossier » : retrouvez-le ensuite dans « Mes dossiers enregistrés », accessible depuis le menu de navigation.</li>
      <li>« Exporter le dossier en PDF » ouvre un aperçu en paysage, à imprimer ou à enregistrer. La fiche comporte des lignes à compléter pour le nom de l’étudiant et son école.</li>
      <li>Dans « Besoins non satisfaits », examinez les propositions provenant des besoins renseignés ; confirmez seulement celles qui sont réellement non satisfaites.</li>
      <li>Dans « Relation entre les éléments », associez un problème et une cause puis préremplissez un diagnostic réel à compléter avec les signes et symptômes.</li>
      <li>« Sauvegarder (JSON) » crée un fichier de secours de tous les dossiers ; « Restaurer » le recharge.</li>
      <li>Pour l’installation, ouvrez d’abord l’application en ligne avec une adresse HTTPS : utilisez « Installer l’application » quand le bouton apparaît, ou le menu du navigateur (« Installer » / « Ajouter à l’écran d’accueil »). Sur iPhone/iPad, utilisez Safari puis Partager &gt; Sur l’écran d’accueil.</li>
      <li>Une première ouverture avec connexion est nécessaire pour mettre l’application en cache. Ensuite, elle peut s’ouvrir hors ligne sur ce même appareil et dans ce même navigateur.</li>
      <li>Version de démonstration : utilisez uniquement des patients fictifs.</li>
    </ul>
  </div></fieldset>;
}

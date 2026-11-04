function TextSection({ title, entries }) {
  return (
    <section className="report-section">
      <h2>{title}</h2>
      {entries.length === 0 ? <p>Aucune donnée renseignée.</p> : (
        <table><tbody>{entries.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
      )}
    </section>
  );
}

function TableSection({ title, headings, rows }) {
  return (
    <section className="report-section">
      <h2>{title}</h2>
      {rows.length === 0 ? <p>Aucune donnée renseignée.</p> : (
        <table className={`report-grid-table${headings.length === 5 ? " plan-table" : ""}`}>
          <thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{rows.map((row, index) => <tr key={`${title}-${index}`}>{row.map((value, cellIndex) => <td key={`${cellIndex}`}>{value || ""}</td>)}</tr>)}</tbody>
        </table>
      )}
    </section>
  );
}

export function ReportPreview({ title, identity, sections, needSections, unmetRows, relationshipRows, realDiagnosisRows, riskDiagnosisRows, objectiveRows, medicalRows, planRows, headings }) {
  return (
    <>
      <h1>{title}</h1>
      <p className="report-date">Démarche de soins — Document de travail</p>
      <div className="report-identity">
        {identity.map(([label, value]) => <p key={label}><strong>{label} :</strong><span>{value || ""}</span></p>)}
      </div>
      {sections.map(section => <TextSection key={section.title} {...section} />)}
      {needSections.map(section => <TableSection key={section.title} {...section} />)}
      <TableSection title="Besoins non satisfaits" headings={["Besoins non satisfaits", "Actions montrant la non-satisfaction"]} rows={unmetRows} />
      <TextSection title="Relation entre les éléments" entries={relationshipRows} />
      <TextSection title="Diagnostics infirmiers : réels ou actuels" entries={realDiagnosisRows} />
      <TextSection title="Diagnostics infirmiers : à risque ou potentiels" entries={riskDiagnosisRows} />
      <TableSection title="Objectifs et interventions" headings={["Objectifs de soins", "Interventions infirmières"]} rows={objectiveRows} />
      <TextSection title="Problèmes médicaux" entries={medicalRows} />
      <TableSection title="Plan de soins" headings={headings} rows={planRows} />
    </>
  );
}

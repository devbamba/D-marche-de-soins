import { useEffect, useState } from "react";

export function RecordsList() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    const handleRecordsUpdate = event => setRecords(event.detail.records);
    window.addEventListener("demarche:records-updated", handleRecordsUpdate);
    return () => window.removeEventListener("demarche:records-updated", handleRecordsUpdate);
  }, []);

  if (!records.length) {
    return <p className="empty-records">Aucun dossier enregistré pour le moment.</p>;
  }

  return records.map(record => (
    <div className="record-row" key={record.id}>
      <div className="record-info">
        <strong>{record.title}</strong>
        <small>Enregistré le {new Date(record.savedAt).toLocaleString("fr-FR")}</small>
      </div>
      <div className="record-actions">
        <button type="button" className="btn alt" data-record-action="open" data-record-id={record.id}>Ouvrir</button>
        <button type="button" className="btn alt" data-record-action="pdf" data-record-id={record.id}>PDF</button>
        <button type="button" className="btn alt" data-record-action="delete" data-record-id={record.id}>Supprimer</button>
      </div>
    </div>
  ));
}

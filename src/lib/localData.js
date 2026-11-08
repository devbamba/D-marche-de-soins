export const RECORDS_KEY = "demarcheSoins.local.records.v1";
export const DRAFT_KEY = "demarcheSoins.local.draft.v1";

export function migrateAccountLocalData() {
  const recordKeys = [];
  const draftKeys = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(`${RECORDS_KEY}.`)) recordKeys.push(key);
    if (key?.startsWith(`${DRAFT_KEY}.`)) draftKeys.push(key);
  }

  const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || "[]");
  if (!Array.isArray(records)) throw new Error("La liste des dossiers locaux est illisible.");
  const merged = new Map(records.map(record => [record.id, record]));
  for (const key of recordKeys) {
    const accountRecords = JSON.parse(localStorage.getItem(key));
    if (!Array.isArray(accountRecords)) continue;
    for (const record of accountRecords) {
      if (!record || typeof record.id !== "string") continue;
      const current = merged.get(record.id);
      if (!current || (record.savedAt || "") > (current.savedAt || "")) merged.set(record.id, record);
    }
  }
  if (merged.size !== records.length) {
    localStorage.setItem(RECORDS_KEY, JSON.stringify([...merged.values()]));
  }

  if (localStorage.getItem(DRAFT_KEY) === null) {
    for (const key of draftKeys) {
      const draft = localStorage.getItem(key);
      if (draft !== null) {
        localStorage.setItem(DRAFT_KEY, draft);
        break;
      }
    }
  }
}

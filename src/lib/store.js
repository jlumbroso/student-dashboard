import { writable } from 'svelte/store';
import { set, get as idbGet } from 'idb-keyval';

// Main roster store.
export const roster = writable([]);

// Filters store with defaults.
// • search: a free-text string.
// • hasGitHub and hasSlack: "all", "yes", or "no".
// • major and classification: default to "all".
export const filters = writable({
  search: "",
  hasGitHub: "all",
  hasSlack: "all",
  major: "all",
  classification: "all"
});

// Key used for persistence.
const ROSTER_KEY = 'student-dashboard-roster';

export async function loadRosterFromDB() {
  const data = await idbGet(ROSTER_KEY);
  if (data) {
    roster.set(data);
  }
}

export function saveRosterToDB(rosterData) {
  return set(ROSTER_KEY, rosterData);
}

// Auto-save whenever roster changes.
roster.subscribe(val => {
  if (val && val.length > 0) {
    saveRosterToDB(val);
  }
});

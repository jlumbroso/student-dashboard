import App from './App.svelte';
import { loadRosterFromDB } from './lib/store.js';

async function main() {
  await loadRosterFromDB();
  const app = new App({
    target: document.getElementById('app')
  });
}

main();

export default app;

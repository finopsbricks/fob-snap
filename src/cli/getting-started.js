import { describeCurrent } from './config-store.js';
import { DEFAULT_API_URL } from '../http.js';

export function gettingStartedHandler() {
  const current = describeCurrent();
  if (current) {
    console.log(`You're set up — using profile '${current.name}' (${current.api_url}).\n`);
  }
  console.log(`fob-snap — push snapshots and manage widgets/dashboards from the terminal.

1. Add a profile (prompts for the secret):
     fob-snap config profiles add default --api-key <KEY>
   (api_url defaults to ${DEFAULT_API_URL}; use --api-url for self-hosted/staging.)

2. Create a widget:
     fob-snap widgets create --title "MRR" --type kpi

3. Push a snapshot (the whole point):
     fob-snap snapshots push <widget-id> --data '{"value":145000,"label":"MRR","unit":"$"}'
     fob-snap snapshots push <widget-id> --data @payload.json --as-of 2026-01-31T00:00:00Z

4. Scrub the history:
     fob-snap snapshots list <widget-id>

Every push is a new immutable version. Use a Push Only API key for push scripts.`);
}

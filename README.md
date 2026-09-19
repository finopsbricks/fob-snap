# fob-snap

CLI + importable client for [Snapshots](https://snapshots.finopsbricks.com) — push versioned
snapshots and manage widgets/dashboards from the terminal or a script.

Snapshots is push-first: you POST a full, typed payload to a widget and it's stored as a new
immutable version. `fob-snap` makes that the one-liner it should be.

## Install

```bash
npm install -g @finopsbricks/fob-snap
```

## Quick start

```bash
# 1. Save credentials (prompts for the secret if you omit --api-secret)
fob-snap config profiles add default --api-key fob_app_xxx

# 2. Create a widget
fob-snap widgets create --title "MRR" --type kpi

# 3. Push a snapshot — the whole point
fob-snap snapshots push <widget-id> --data '{"value":145000,"label":"MRR","unit":"$"}'
fob-snap snapshots push <widget-id> --data @payload.json --as-of 2026-01-31T00:00:00Z

# 4. Scrub the history
fob-snap snapshots list <widget-id>
```

Use a **Push Only** API key for push scripts. `--as-of` is the business time the data describes
(defaults to now); every push is a new version, never an overwrite.

## Commands

| Command | Description |
|---|---|
| `config profiles add\|list\|use\|remove\|current` | Manage credential profiles (`~/.fob/fob-snap/config.yml`) |
| `snapshots push <widget> --data <json>` | Push a snapshot (full typed payload) |
| `snapshots list <widget>` | List a widget's versions, newest first |
| `widgets list\|show\|create\|delete` | Manage widgets |
| `dashboards list\|show\|create\|delete` | Manage dashboards |
| `dashboards add-widget\|remove-widget <dashboard> …` | Place / unplace widgets |
| `dashboards share\|unshare <dashboard>` | Create / revoke the public link |

`--profile <name>` selects a profile per-command; `--json` prints raw JSON on any read command.
`FOB_DEBUG=1` prints stack traces.

## As a library

The same client the CLI uses is importable — inject credentials, never read from env:

```js
import { fobSnap } from '@finopsbricks/fob-snap';

const snap = fobSnap({ api_key, api_secret }); // api_url optional (hosted origin)
await snap.snapshots.push(widgetId, { data: { value: 145000 }, as_of: '2026-01-31T00:00:00Z' });
const { data: widgets } = await snap.widgets.list();
```

## Auth

Requests send `api-key` / `api-secret` headers. Create a key in the Snapshots app under
**Settings → API keys**; the **Push Only** preset grants exactly `snapshot:create` (+ read).
Widget/dashboard management needs a key with the matching `widget:*` / `dashboard:*` scopes.

## License

Apache-2.0

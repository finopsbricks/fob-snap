/**
 * `fob-snap snapshots <action>` — push and list snapshot versions.
 *
 * `push` is the product's defining action: submit a FULL typed payload and it's
 * stored as a new immutable version.
 */

import { readFileSync } from 'node:fs';
import { Command } from 'commander';

import { safe, listOptions, clientFor } from '../_helpers.js';
import { printJson, printTable, trunc } from '../_output.js';

/**
 * Parse a `--data` argument: `@path` reads a JSON file, otherwise the value is
 * treated as an inline JSON string. Returns the parsed `data` payload.
 */
function parseData(arg) {
  if (!arg) throw new Error('Provide the payload with --data <@file.json | inline-json>.');
  const raw = arg.startsWith('@') ? readFileSync(arg.slice(1), 'utf8') : arg;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`--data is not valid JSON: ${err.message}`);
  }
  // Accept either the bare payload, or a full { data, as_of } envelope.
  return parsed && typeof parsed === 'object' && 'data' in parsed ? parsed : { data: parsed };
}

async function pushHandler(argv) {
  const envelope = parseData(argv.data);
  const body = { data: envelope.data, as_of: argv.asOf ?? envelope.as_of };
  const { data: snapshot } = await clientFor().snapshots.push(argv.widget, body);
  if (argv.json) return printJson(snapshot);
  console.log(`Pushed v${snapshot.version} to ${snapshot.widget} (as of ${snapshot.as_of}).`);
}

async function listHandler(argv) {
  const res = await clientFor().snapshots.list(argv.widget, { page: argv.page, limit: argv.limit });
  if (argv.json) return printJson(res);
  printTable(
    [
      { header: 'VERSION', get: (s) => `v${s.version}` },
      { header: 'AS OF', get: (s) => s.as_of },
      { header: 'RECEIVED', get: (s) => s.received_at },
      { header: 'DATA', get: (s) => trunc(JSON.stringify(s.data), 40) },
    ],
    res.data,
  );
  if (res.page_context) console.log(`\n${res.page_context.total} version(s).`);
}

export function buildSnapshotsCommand() {
  const snapshots = new Command('snapshots').description('Push and list snapshot versions');

  snapshots
    .command('push')
    .description('Push a snapshot (full typed payload) to a widget')
    .argument('<widget>', 'Widget id')
    .requiredOption('--data <json>', 'Payload as inline JSON or @file.json (bare payload, or { data, as_of })')
    .option('--as-of <iso>', 'Business time this data describes (ISO 8601; defaults to now)')
    .option('--json', 'Output raw JSON')
    .action(safe(pushHandler));

  listOptions(
    snapshots.command('list').description("List a widget's versions, newest first").argument('<widget>', 'Widget id'),
  ).action(safe(listHandler));

  return snapshots;
}

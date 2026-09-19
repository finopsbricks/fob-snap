/**
 * `fob-snap widgets <action>` — manage widgets over the REST API.
 */

import { readFileSync } from 'node:fs';
import { Command } from 'commander';

import { safe, listOptions, jsonOption, clientFor } from '../_helpers.js';
import { printJson, printTable, trunc } from '../_output.js';

const WIDGET_TYPES = ['line', 'bar', 'area', 'kpi', 'table', 'pie'];

function parseConfig(arg) {
  if (!arg) return undefined;
  const raw = arg.startsWith('@') ? readFileSync(arg.slice(1), 'utf8') : arg;
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`--config is not valid JSON: ${err.message}`);
  }
}

async function listHandler(argv) {
  const res = await clientFor().widgets.list({ page: argv.page, limit: argv.limit });
  if (argv.json) return printJson(res);
  printTable(
    [
      { header: 'ID', get: (w) => w.id },
      { header: 'TITLE', get: (w) => trunc(w.title, 32) },
      { header: 'TYPE', get: (w) => w.type },
      { header: 'RETENTION', get: (w) => (w.retention_days == null ? 'keep-all' : `${w.retention_days}d`) },
      { header: 'CREATED', get: (w) => w.created_at },
    ],
    res.data,
  );
  if (res.page_context) console.log(`\n${res.page_context.total} widget(s).`);
}

async function showHandler(argv) {
  const { data: widget } = await clientFor().widgets.get(argv.id);
  printJson(widget);
}

async function createHandler(argv) {
  if (!WIDGET_TYPES.includes(argv.type)) {
    throw new Error(`--type must be one of: ${WIDGET_TYPES.join(', ')}`);
  }
  const body = {
    title: argv.title,
    type: argv.type,
    retention_days: argv.retentionDays === undefined ? null : Number(argv.retentionDays),
    config: parseConfig(argv.config),
  };
  const { data: widget } = await clientFor().widgets.create(body);
  if (argv.json) return printJson(widget);
  console.log(`Created ${argv.type} widget '${widget.title}' → ${widget.id}`);
}

async function deleteHandler(argv) {
  await clientFor().widgets.delete(argv.id);
  console.log(`Deleted widget ${argv.id}.`);
}

export function buildWidgetsCommand() {
  const widgets = new Command('widgets').alias('widget').description('Manage widgets');

  listOptions(widgets.command('list').description("List the org's widgets")).action(safe(listHandler));
  jsonOption(widgets.command('show').description('Show one widget').argument('<id>', 'Widget id')).action(safe(showHandler));

  widgets
    .command('create')
    .description('Create a widget')
    .requiredOption('--title <title>', 'Widget title')
    .requiredOption('--type <type>', `Widget type (${WIDGET_TYPES.join('|')})`)
    .option('--retention-days <n>', 'Keep only the last N days of versions (default: keep all)')
    .option('--config <json>', 'Visualization config as inline JSON or @file.json')
    .option('--json', 'Output raw JSON')
    .action(safe(createHandler));

  widgets.command('delete').alias('rm').description('Delete a widget (snapshots cascade)').argument('<id>', 'Widget id').action(safe(deleteHandler));

  return widgets;
}

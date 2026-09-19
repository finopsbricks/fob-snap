/**
 * `fob-snap dashboards <action>` — manage dashboards, placements, and share links.
 */

import { Command } from 'commander';

import { safe, listOptions, jsonOption, clientFor } from '../_helpers.js';
import { printJson, printTable, trunc } from '../_output.js';

async function listHandler(argv) {
  const res = await clientFor().dashboards.list({ page: argv.page, limit: argv.limit });
  if (argv.json) return printJson(res);
  printTable(
    [
      { header: 'ID', get: (d) => d.id },
      { header: 'TITLE', get: (d) => trunc(d.title, 40) },
      { header: 'CREATED', get: (d) => d.created_at },
    ],
    res.data,
  );
  if (res.page_context) console.log(`\n${res.page_context.total} dashboard(s).`);
}

async function showHandler(argv) {
  const client = clientFor();
  const { data: dashboard } = await client.dashboards.get(argv.id);
  const { data: placements } = await client.dashboards.listWidgets(argv.id);
  printJson({ ...dashboard, widgets: placements });
}

async function createHandler(argv) {
  const { data: dashboard } = await clientFor().dashboards.create({ title: argv.title });
  if (argv.json) return printJson(dashboard);
  console.log(`Created dashboard '${dashboard.title}' → ${dashboard.id}`);
}

async function deleteHandler(argv) {
  await clientFor().dashboards.delete(argv.id);
  console.log(`Deleted dashboard ${argv.id}.`);
}

async function addWidgetHandler(argv) {
  const { data: placement } = await clientFor().dashboards.addWidget(argv.dashboard, { widget_id: argv.widget });
  if (argv.json) return printJson(placement);
  console.log(`Placed widget ${argv.widget} on dashboard ${argv.dashboard} (placement ${placement.id}).`);
}

async function removeWidgetHandler(argv) {
  await clientFor().dashboards.removeWidget(argv.dashboard, argv.placement);
  console.log(`Removed placement ${argv.placement} from dashboard ${argv.dashboard}.`);
}

async function shareHandler(argv) {
  const { data: share } = await clientFor().dashboards.share(argv.id);
  if (argv.json) return printJson(share);
  console.log(`Public link: /s/${share.share_token}`);
}

async function unshareHandler(argv) {
  await clientFor().dashboards.unshare(argv.id);
  console.log(`Revoked the public link for dashboard ${argv.id}.`);
}

export function buildDashboardsCommand() {
  const dashboards = new Command('dashboards').description('Manage dashboards, placements, and share links');

  listOptions(dashboards.command('list').description("List the org's dashboards")).action(safe(listHandler));
  jsonOption(dashboards.command('show').description('Show a dashboard with its placements').argument('<id>', 'Dashboard id')).action(safe(showHandler));

  dashboards
    .command('create')
    .description('Create a dashboard')
    .requiredOption('--title <title>', 'Dashboard title')
    .option('--json', 'Output raw JSON')
    .action(safe(createHandler));

  dashboards.command('delete').description('Delete a dashboard').argument('<id>', 'Dashboard id').action(safe(deleteHandler));

  dashboards
    .command('add-widget')
    .description('Place a widget on a dashboard')
    .argument('<dashboard>', 'Dashboard id')
    .argument('<widget>', 'Widget id')
    .option('--json', 'Output raw JSON')
    .action(safe(addWidgetHandler));

  dashboards
    .command('remove-widget')
    .description('Remove a placement from a dashboard')
    .argument('<dashboard>', 'Dashboard id')
    .argument('<placement>', 'Placement id (from `dashboards show`)')
    .action(safe(removeWidgetHandler));

  jsonOption(dashboards.command('share').description('Create/return the public share link').argument('<id>', 'Dashboard id')).action(safe(shareHandler));
  dashboards.command('unshare').description('Revoke the public share link').argument('<id>', 'Dashboard id').action(safe(unshareHandler));

  return dashboards;
}

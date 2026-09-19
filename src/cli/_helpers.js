/**
 * Shared CLI helpers: the `safe` handler adapter, `clientFor` (builds the authed
 * client from the resolved profile), and small option builders.
 */

import { resolveCredentials } from './config-store.js';
import { fobSnap } from '../index.js';

/**
 * Adapt a handler taking one merged `argv` to commander's `(…positionals, opts, cmd)`
 * signature, with clean-exit behaviour on an unexpected throw (`FOB_DEBUG=1` for the stack).
 * Positional names come from the command's declaration, camelised like option names.
 */
export function safe(handler) {
  return async (...args) => {
    const cmd = args[args.length - 1];
    const opts = args[args.length - 2];
    const positionals = args.slice(0, -2);

    const argv = { ...opts };
    const declared = cmd.registeredArguments ?? [];
    declared.forEach((arg, i) => {
      argv[toCamel(arg.name())] = positionals[i];
    });
    // Global options live on the root command — merge them down (leaf wins).
    let parent = cmd.parent;
    while (parent) {
      Object.assign(argv, parent.opts(), argv);
      parent = parent.parent;
    }

    try {
      await handler(argv);
    } catch (err) {
      console.error(`Error: ${err.message}`);
      if (err.details?.length) for (const d of err.details) console.error(`  - ${d}`);
      if (process.env.FOB_DEBUG) console.error(err.stack);
      process.exit(1);
    }
  };
}

function toCamel(s) {
  return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/** Build the authed Snapshots client from the current profile. */
export function clientFor() {
  return fobSnap(resolveCredentials());
}

/** Standard `--json` output flag. */
export function jsonOption(cmd) {
  return cmd.option('--json', 'Output raw JSON');
}

/** Pagination + `--json` for list commands. */
export function listOptions(cmd) {
  return jsonOption(cmd)
    .option('--page <n>', 'Page number', Number, 1)
    .option('--limit <n>', 'Page size (max 500)', Number, 100);
}

/**
 * Help formatting for the whole tree, per the CLI standard's command-grammar note
 * (Options: above Global Options:, hang-indented descriptions).
 *
 * `subcommandTerm` drops commander's default `[options]` suffix so the name column
 * stays narrow enough for descriptions to wrap cleanly; aliases are preserved
 * (`remove|rm`), since help is the only place a reader discovers them.
 *
 * `showGlobalOptions` renders the mandated `Options:` / `Global Options:` split.
 *
 * Commander does not inherit `configureHelp()` through `addCommand()`, so this
 * walks the tree rather than being set once at the root.
 */
export function configureTreeHelp(cmd) {
  cmd.configureHelp({
    helpWidth: process.stdout.columns || 92,
    showGlobalOptions: true,
    subcommandTerm: (c) => {
      const name = c.aliases().length ? `${c.name()}|${c.aliases().join('|')}` : c.name();
      return `${name} ${c.usage().replace(/\[options\] ?/, '')}`.trim();
    },
    // Commander adds an implicit `help [command]` subcommand; `--help` is already
    // under Options:, so the row is noise in a resource listing.
    visibleCommands: (c) => c.commands.filter((sub) => sub.name() !== 'help' && !sub._hidden),
  });
  for (const child of cmd.commands) configureTreeHelp(child);
  return cmd;
}

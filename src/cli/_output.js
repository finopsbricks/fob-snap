/** Plain-text table + JSON output helpers for CLI commands. */

/** Pretty-print a value as indented JSON. */
export function printJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

/**
 * Render rows as an aligned text table.
 * @param {Array<{ header: string, get: (row: any) => string }>} columns
 * @param {any[]} rows
 */
export function printTable(columns, rows) {
  if (!rows || rows.length === 0) {
    console.log('(none)');
    return;
  }
  const cells = rows.map((row) => columns.map((c) => String(c.get(row) ?? '')));
  const widths = columns.map((c, i) => Math.max(c.header.length, ...cells.map((r) => r[i].length)));
  const line = (arr) => arr.map((v, i) => v.padEnd(widths[i])).join('  ').trimEnd();

  console.log(line(columns.map((c) => c.header)));
  console.log(line(widths.map((w) => '-'.repeat(w))));
  for (const r of cells) console.log(line(r));
}

/** Truncate a string for table display. */
export function trunc(v, n = 32) {
  const s = v == null ? '' : String(v);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// Keep VxeColumn instances (and their header slots) alive. VXE registers a
// column once on mount; moving Vue nodes alone does not reorder that registry.
export async function syncVxeColumnOrder(table, columns, fieldForColumn = column => column.field || column.key) {
  if (!table) return;
  const registered = table.getTableColumn().collectColumn;
  const byField = new Map(registered.map(column => [column.field, column]));
  const ordered = columns.map(column => byField.get(fieldForColumn(column)));
  // An unmounted/loading table will register its initial DOM order itself.
  if (ordered.length !== registered.length || ordered.some(column => !column)) return;
  if (ordered.every((column, index) => column === registered[index])) return;
  // loadColumn accepts existing ColumnInfo objects; ids, slots and sort state
  // are preserved. reloadColumn would clear table state and is not appropriate.
  await table.loadColumn(ordered);
}

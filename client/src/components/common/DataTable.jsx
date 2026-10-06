export function DataTable({ columns, rows, rowKey = "_id", empty }) {
  if (!rows.length) return empty;

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="border-b border-stone-200 bg-stone-50/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-stone-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr key={row[rowKey]} className="bg-white hover:bg-stone-50/60">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-5 py-4 align-middle text-sm text-stone-700"
                  >
                    {column.render
                      ? column.render(row)
                      : (row[column.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-stone-200 md:hidden">
        {rows.map((row) => (
          <div key={row[rowKey]} className="space-y-3 bg-white p-4">
            {columns.map((column) => (
              <div
                key={column.key}
                className="flex items-start justify-between gap-4"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  {column.label}
                </span>
                <div className="text-right text-sm text-stone-700">
                  {column.render
                    ? column.render(row)
                    : (row[column.key] ?? "—")}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

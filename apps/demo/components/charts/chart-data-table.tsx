/** Screen-reader table view of a chart's data, so nothing is conveyed by the plot alone. */
export function ChartDataTable<T extends Record<string, string | number>>({
  caption,
  rows,
  columns,
}: {
  caption: string
  rows: T[]
  columns: { key: keyof T & string; label: string }[]
}) {
  return (
    // Hidden by a div: a table ignores sr-only's 1px size, so its rows would still lengthen the page.
    <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c.key}>{row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

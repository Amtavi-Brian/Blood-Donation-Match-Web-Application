import './DataTable.css'

function DataTable({ columns, rows, emptyMessage = 'No records found.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="data-table__empty">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.id ?? `${rowIndex}-${row.name ?? 'row'}`}>
              {columns.map((column) => (
                <td key={`${rowIndex}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

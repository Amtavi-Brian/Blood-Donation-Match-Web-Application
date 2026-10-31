import { useEffect, useMemo, useState } from 'react'

import { fetchReportSummary } from '../../services/reportService'

const currencyNm = new Intl.NumberFormat('en-US')

function AnalyticsDashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadReport() {
      try {
        const data = await fetchReportSummary()
        if (isMounted) {
          setReport(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'The analytics report could not be loaded.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadReport()

    return () => {
      isMounted = false
    }
  }, [])

  const summaryCards = useMemo(() => {
    if (!report?.overview) {
      return []
    }

    const overview = report.overview
    return [
      { label: 'Total stock units', value: currencyNm.format(overview.total_stock_units) },
      { label: 'Verified hospitals', value: currencyNm.format(overview.verified_hospitals) },
      { label: 'Active donors', value: currencyNm.format(overview.active_donors) },
      { label: 'Pending requests', value: currencyNm.format(overview.pending_requests) },
    ]
  }, [report])

  const maxStockUnits = useMemo(() => {
    if (!report?.stock_by_blood_type?.length) return 1
    return Math.max(...report.stock_by_blood_type.map((item) => item.units))
  }, [report])

  const maxDemandUnits = useMemo(() => {
    if (!report?.demand_by_blood_type?.length) return 1
    return Math.max(...report.demand_by_blood_type.map((item) => item.units_needed))
  }, [report])

  if (loading) {
    return <div className="analytics-shell">Loading analytics report…</div>
  }

  if (error) {
    return <div className="analytics-shell error">{error}</div>
  }

  if (!report) {
    return <div className="analytics-shell">No analytics data available.</div>
  }

  return (
    <div className="analytics-shell">
      <header className="analytics-header">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h1>Blood demand and stock analytics</h1>
        </div>
        <button type="button" className="primary-btn">Export report</button>
      </header>

      <section className="stats-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="stat-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="analytics-grid">
        <article className="panel chart-panel">
          <h2>Current stock by blood type</h2>
          <div className="bar-list">
            {report.stock_by_blood_type.map((item) => (
              <div key={item.blood_group} className="bar-row">
                <div className="label-row">
                  <span>{item.blood_group}</span>
                  <strong>{item.units}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill stock"
                    style={{ width: `${(item.units / maxStockUnits) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel chart-panel">
          <h2>Demand by blood type</h2>
          <div className="bar-list">
            {report.demand_by_blood_type.map((item) => (
              <div key={item.blood_group} className="bar-row">
                <div className="label-row">
                  <span>{item.blood_group}</span>
                  <strong>{item.units_needed}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill demand"
                    style={{ width: `${(item.units_needed / maxDemandUnits) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <h2>Recent requests</h2>
        <table className="report-table">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Group</th>
              <th>Units</th>
              <th>Urgency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.recent_requests.map((request) => (
              <tr key={request.id}>
                <td>{request.hospital_name}</td>
                <td>{request.blood_group}</td>
                <td>{request.units_needed}</td>
                <td>{request.urgency}</td>
                <td>
                  <span className={`status-pill ${request.status}`}>{request.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

export default AnalyticsDashboard


import { useEffect, useMemo, useState } from 'react'
import MetricCard from '../../componenets/dashboard/MetricCard'
import { fetchReportSummary } from '../../services/reportService'
import './Analytics.css'

const numberFormat = new Intl.NumberFormat('en-US')

const tabs = ['Stock Levels', 'Donor Trends', 'Demand Forecast']

function AnalyticsDashboard() {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('Stock Levels')

  async function loadReport() {
    setLoading(true)
    setError('')

    try {
      const data = await fetchReportSummary()
      setReport(data)
    } catch (err) {
      setError(err.message || 'Unable to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function load() {
      try {
        const data = await fetchReportSummary()
        if (isMounted) setReport(data)
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unable to load analytics.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [])

  const overview = report?.overview || {}

  const summaryCards = [
    {
      label: 'Total Stock Units',
      value: overview.total_stock_units ?? 0,
      icon: '▤',
      color: 'red',
    },
    {
      label: 'Verified Hospitals',
      value: overview.verified_hospitals ?? 0,
      icon: '✚',
      color: 'green',
    },
    {
      label: 'Active Donors',
      value: overview.active_donors ?? 0,
      icon: '♙',
      color: 'purple',
    },
    {
      label: 'Pending Requests',
      value: overview.pending_requests ?? 0,
      icon: '◷',
      color: 'orange',
    },
  ]

  const stockData = report?.stock_by_blood_type || []
  const demandData = report?.demand_by_blood_type || []
  const recentRequests = report?.recent_requests || []

  const maxStockUnits = Math.max(
    1,
    ...stockData.map((item) => Number(item.units) || 0)
  )

  const maxDemandUnits = Math.max(
    1,
    ...demandData.map((item) => Number(item.units_needed) || 0)
  )

  const totalDemand = demandData.reduce(
    (total, item) => total + (Number(item.units_needed) || 0),
    0
  )

  const topDemandGroups = useMemo(() => {
    return [...demandData]
      .sort((a, b) => Number(b.units_needed) - Number(a.units_needed))
      .slice(0, 6)
  }, [report])

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner" />
        <p>Loading BloodLink analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="analytics-message">
        <h2>Unable to load analytics</h2>
        <p>{error}</p>
        <button className="bl-primary-btn" onClick={loadReport}>
          Try again
        </button>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="analytics-message">
        <h2>No analytics data available</h2>
        <p>Reports will appear here when data becomes available.</p>
        <button className="bl-primary-btn" onClick={loadReport}>
          Refresh
        </button>
      </div>
    )
  }

  return (
    <main className="bl-main">

        <header className="bl-topbar">
          <div>
            <h2>Analytics & Reports</h2>
            <p>Monitor blood stock, donations and demand.</p>
          </div>

          <div className="topbar-actions">
            <button className="notification-btn" aria-label="Notifications">
              ♧
              <span />
            </button>
            <div className="topbar-avatar">KN</div>
          </div>
        </header>

        <div className="analytics-content">

          {/* Page heading */}
          <section className="analytics-heading">
            <div>
              <h1>Analytics & Reports</h1>
              <p>
                Get insights into your hospital's blood stock
                and donation activities.
              </p>
            </div>
            <button className="bl-outline-btn" onClick={() => window.print()}>
              ↓ Export report
            </button>
          </section>

          {/* Summary cards */}
          <section className="bl-stats-grid">
            {summaryCards.map((card) => (
              <MetricCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                subtitle={card.subtitle}
                tone={card.color}
              />
            ))}
          </section>

          {/* Tabs */}
          <section className="analytics-tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'tab active' : 'tab'}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </section>

          {/* Stock Levels */}
          {activeTab === 'Stock Levels' && (
            <>
              <section className="analytics-chart-grid">

                <article className="bl-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Blood Stock Levels</h3>
                      <p>Available units by blood group</p>
                    </div>
                    <span className="panel-icon">▥</span>
                  </div>

                  {stockData.length ? (
                    <div className="vertical-chart">
                      {stockData.map((item, index) => {
                        const height = Math.max(
                          2,
                          (Number(item.units) / maxStockUnits) * 100
                        )

                        return (
                          <div className="vertical-bar-item" key={item.blood_group}>
                            <strong>{item.units}</strong>
                            <div className="vertical-bar-track">
                              <div
                                className={`vertical-bar bar-${index % 5}`}
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <span>{item.blood_group}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="empty-chart">
                      No blood stock records available.
                    </p>
                  )}
                </article>

                <article className="bl-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Blood Demand</h3>
                      <p>Requested units by blood group</p>
                    </div>
                    <span className="panel-icon">♡</span>
                  </div>

                  {demandData.length ? (
                    <div className="horizontal-chart">
                      {demandData.map((item) => (
                        <div className="horizontal-bar-item" key={item.blood_group}>
                          <div className="horizontal-label">
                            <span>{item.blood_group}</span>
                            <strong>{item.units_needed} units</strong>
                          </div>

                          <div className="horizontal-track">
                            <div
                              className="horizontal-fill"
                              style={{
                                width: `${
                                  (Number(item.units_needed) / maxDemandUnits) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-chart">
                      No blood request records available.
                    </p>
                  )}
                </article>
              </section>

              <section className="analytics-bottom-grid">

                <article className="bl-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Top Blood Types in Demand</h3>
                      <p>Distribution of requested blood units</p>
                    </div>
                  </div>

                  <div className="demand-groups">
                    {topDemandGroups.map((item, index) => {
                      const percentage = totalDemand
                        ? Math.round(
                            (Number(item.units_needed) / totalDemand) * 100
                          )
                        : 0

                      return (
                        <div className="demand-group" key={item.blood_group}>
                          <div className={`blood-group-icon group-${index % 6}`}>
                            {item.blood_group}
                          </div>
                          <strong>{percentage}%</strong>
                          <small>{item.units_needed} units</small>
                        </div>
                      )
                    })}
                  </div>
                </article>

                <article className="bl-panel">
                  <div className="panel-heading">
                    <div>
                      <h3>Report Summary</h3>
                      <p>Current hospital statistics</p>
                    </div>
                  </div>

                  <div className="summary-list">
                    <div>
                      <span>Total stock units</span>
                      <strong>
                        {numberFormat.format(overview.total_stock_units ?? 0)}
                      </strong>
                    </div>
                    <div>
                      <span>Total pending requests</span>
                      <strong>
                        {numberFormat.format(overview.pending_requests ?? 0)}
                      </strong>
                    </div>
                    <div>
                      <span>Total requested units</span>
                      <strong>{numberFormat.format(totalDemand)}</strong>
                    </div>
                    <div>
                      <span>Stock records</span>
                      <strong>{stockData.length}</strong>
                    </div>
                  </div>
                </article>

              </section>
            </>
          )}

          {/* Donor Trends */}
          {activeTab === 'Donor Trends' && (
            <section className="bl-panel empty-tab">
              <div className="empty-tab-icon">↗</div>
              <h3>Donation Trends</h3>
              <p>
                Historical donation data will appear here once the
                backend provides donation records grouped by date.
              </p>
            </section>
          )}

          {/* Demand Forecast */}
          {activeTab === 'Demand Forecast' && (
            <section className="bl-panel">
              <div className="panel-heading">
                <div>
                  <h3>Demand Analysis</h3>
                  <p>Current blood demand by group</p>
                </div>
              </div>

              {demandData.length ? (
                <>
                  <div className="horizontal-chart forecast-chart">
                    {demandData.map((item) => (
                      <div className="horizontal-bar-item" key={item.blood_group}>
                        <div className="horizontal-label">
                          <span>{item.blood_group}</span>
                          <strong>{item.units_needed} units</strong>
                        </div>
                        <div className="horizontal-track">
                          <div
                            className="horizontal-fill"
                            style={{
                              width: `${
                                (Number(item.units_needed) / maxDemandUnits) * 100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="forecast-note">
                    This represents recorded demand, not a prediction of future
                    demand. Forecasting requires historical time-series data.
                  </p>
                </>
              ) : (
                <p className="empty-chart">No demand data available.</p>
              )}
            </section>
          )}

          {/* Recent requests */}
          <section className="bl-panel requests-panel">
            <div className="panel-heading">
              <div>
                <h3>Recent Blood Requests</h3>
                <p>Latest hospital blood request activity</p>
              </div>
            </div>

            <div className="table-responsive">
              <table className="bl-table">
                <thead>
                  <tr>
                    <th>Hospital</th>
                    <th>Blood Group</th>
                    <th>Units</th>
                    <th>Urgency</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentRequests.length ? (
                    recentRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.hospital_name}</td>
                        <td>{request.blood_group}</td>
                        <td>{request.units_needed}</td>
                        <td>{request.urgency}</td>
                        <td>
                          <span
                            className={`status-pill ${
                              ['pending', 'fulfilled', 'cancelled'].includes(
                                String(request.status).toLowerCase()
                              )
                                ? String(request.status).toLowerCase()
                                : 'default'
                            }`}
                          >
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="table-empty">
                        No recent requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <footer className="analytics-footer">
            BloodLink · Together we save lives.
          </footer>

        </div>
      </main>
  )
}

export default AnalyticsDashboard

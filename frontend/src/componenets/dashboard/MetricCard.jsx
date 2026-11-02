import './MetricCard.css'

const formatValue = (value) => {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return value
}

function MetricCard({ icon, label, value, subtitle, tone = 'red' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__icon" aria-hidden="true">{icon}</div>

      <div className="metric-card__content">
        <span className="metric-card__label">{label}</span>
        <strong className="metric-card__value">{formatValue(value)}</strong>
        {subtitle ? <small className="metric-card__meta">{subtitle}</small> : null}
      </div>
    </article>
  )
}

export default MetricCard

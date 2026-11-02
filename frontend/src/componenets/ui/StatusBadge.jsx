import './StatusBadge.css'

const variantMap = {
  pending: 'pending',
  fulfilled: 'fulfilled',
  cancelled: 'cancelled',
  default: 'default',
}

function StatusBadge({ label, status }) {
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : 'default'
  const variant = variantMap[normalizedStatus] || 'default'

  return <span className={`status-badge status-badge--${variant}`}>{label ?? normalizedStatus}</span>
}

export default StatusBadge

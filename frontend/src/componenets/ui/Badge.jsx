import './Badge.css'

function Badge({ children, size = 'md', tone = 'neutral', className = '' }) {
  return (
    <span className={`badge badge--${size} badge--${tone} ${className}`.trim()}>
      {children}
    </span>
  )
}

export default Badge

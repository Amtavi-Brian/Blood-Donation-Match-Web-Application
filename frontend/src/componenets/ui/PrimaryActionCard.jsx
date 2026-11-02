import './PrimaryActionCard.css'

function PrimaryActionCard({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
  accent = 'red'
}) {
  return (
    <div className={`primary-action-card primary-action-card--${accent}`}>
      <div className="primary-action-card__content">
        {eyebrow && <span className="primary-action-card__eyebrow">{eyebrow}</span>}
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>

      {actionLabel && (
        <button type="button" className="primary-action-card__button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default PrimaryActionCard

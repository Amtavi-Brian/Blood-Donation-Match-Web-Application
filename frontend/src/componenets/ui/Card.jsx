import './Card.css'

function Card({ title, subtitle, action, size = 'md', children, className = '' }) {
  return (
    <article className={`card card--${size} ${className}`.trim()}>
      {(title || subtitle || action) && (
        <div className="card__header">
          <div>
            {title ? <h3 className="card__title">{title}</h3> : null}
            {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
          </div>
          {action ? <div className="card__action">{action}</div> : null}
        </div>
      )}

      <div className="card__body">{children}</div>
    </article>
  )
}

export default Card

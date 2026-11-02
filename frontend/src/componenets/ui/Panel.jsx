import './Panel.css'

function Panel({
  title,
  subtitle,
  icon,
  action,
  children,
  className = '',
  variant = 'default'
}) {
  return (
    <section className={`panel panel--${variant} ${className}`.trim()}>
      {(title || subtitle || icon || action) && (
        <div className="panel__header">
          <div className="panel__heading">
            {icon ? <span className="panel__icon">{icon}</span> : null}
            <div>
              {title ? <h3 className="panel__title">{title}</h3> : null}
              {subtitle ? <p className="panel__subtitle">{subtitle}</p> : null}
            </div>
          </div>

          {action ? <div className="panel__action">{action}</div> : null}
        </div>
      )}

      <div className="panel__body">{children}</div>
    </section>
  )
}

export default Panel

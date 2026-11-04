import './EmptyState.css'

function EmptyState({ icon, title, description, action }) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      {title ? <h3 className="empty-state__title">{title}</h3> : null}
      {description ? <p className="empty-state__description">{description}</p> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  )
}

export default EmptyState

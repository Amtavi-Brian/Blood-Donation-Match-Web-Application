import './SectionHeader.css'

function SectionHeader({ eyebrow, title, description, action, align = 'left' }) {
  return (
    <div className={`section-header section-header--${align}`}>
      <div className="section-header__text">
        {eyebrow ? <p className="section-header__eyebrow">{eyebrow}</p> : null}
        {title ? <h3 className="section-header__title">{title}</h3> : null}
        {description ? <p className="section-header__description">{description}</p> : null}
      </div>

      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  )
}

export default SectionHeader

import './Tabs.css'

function Tabs({ items = [], active, onChange }) {
  return (
    <div className="tabs">
      {items.map((item) => {
        const isActive = active === item.value

        return (
          <button
            key={item.value}
            type="button"
            className={`tabs__button ${isActive ? 'is-active' : ''}`.trim()}
            onClick={() => onChange?.(item.value)}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs

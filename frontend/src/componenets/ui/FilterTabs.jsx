import './FilterTabs.css'

function FilterTabs({ tabs, activeTab, onChange, variant = 'default' }) {
  return (
    <div className={`filter-tabs filter-tabs--${variant}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value

        return (
          <button
            key={tab.value}
            type="button"
            className={`filter-tab ${isActive ? 'is-active' : ''}`}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

export default FilterTabs

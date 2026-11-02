import './Select.css'

function Select({ label, id, options = [], className = '', ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="select-field">
      {label ? (
        <label htmlFor={selectId} className="select-field__label">
          {label}
        </label>
      ) : null}

      <select id={selectId} className={`select-field__control ${className}`.trim()} {...props}>
        {options.map((option) => (
          <option key={option.value ?? option.label} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select

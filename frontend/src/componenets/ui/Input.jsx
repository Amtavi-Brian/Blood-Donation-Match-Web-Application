import './Input.css'

function Input({
  label,
  helper,
  error,
  id,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="field">
      {label ? (
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        className={`field__control ${error ? 'field__control--error' : ''} ${className}`.trim()}
        {...props}
      />

      {helper && !error ? <span className="field__helper">{helper}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  )
}

export default Input

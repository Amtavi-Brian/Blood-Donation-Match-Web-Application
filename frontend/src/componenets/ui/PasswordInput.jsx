import { useState } from 'react'
import './PasswordInput.css'

function PasswordInput({ label, helper, error, id, ...props }) {
  const [showPassword, setShowPassword] = useState(false)
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="password-field">
      {label ? (
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        type={showPassword ? 'text' : 'password'}
        className={`field__control ${error ? 'field__control--error' : ''}`.trim()}
        {...props}
      />

      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setShowPassword((prev) => !prev)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? 'Hide' : 'Show'}
      </button>

      {helper && !error ? <span className="field__helper">{helper}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  )
}

export default PasswordInput

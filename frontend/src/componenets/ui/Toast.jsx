import './Toast.css'

function Toast({ title, message, variant = 'info' }) {
  return (
    <div className={`toast toast--${variant}`} role="status" aria-live="polite">
      {title ? <p className="toast__title">{title}</p> : null}
      {message ? <p className="toast__message">{message}</p> : null}
    </div>
  )
}

export default Toast

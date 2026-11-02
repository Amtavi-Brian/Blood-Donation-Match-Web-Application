import './Modal.css'

function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal__header">
          {title ? <h3 className="modal__title">{title}</h3> : null}
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>
  )
}

export default Modal

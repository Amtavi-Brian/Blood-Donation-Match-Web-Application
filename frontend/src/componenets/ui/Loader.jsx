import './Loader.css'

function Loader({ size = 'md' }) {
  return (
    <div className="loader" aria-live="polite" aria-busy="true">
      <span
        className="loader__spinner"
        style={{
          width: size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.5rem',
          height: size === 'sm' ? '1rem' : size === 'lg' ? '2rem' : '1.5rem',
        }}
      />
    </div>
  )
}

export default Loader

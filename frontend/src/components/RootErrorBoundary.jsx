import React from 'react'

// Reusable root-level error boundary to avoid blank screen and surface runtime errors.
class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[RootErrorBoundary] Runtime error caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'Poppins, sans-serif' }}>
          <h2 style={{ color: '#c00', marginBottom: '1rem' }}>Algo deu errado ao renderizar a aplicação.</h2>
          <p>Detalhes do erro (visível apenas em desenvolvimento):</p>
          <pre style={{ background: '#f4f4f4', padding: '1rem', overflow: 'auto', maxHeight: 300 }}>
            {String(this.state.error && (this.state.error.stack || this.state.error))}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Recarregar página
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default RootErrorBoundary

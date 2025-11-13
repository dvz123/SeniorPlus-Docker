import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // You can log the error to an error reporting service here
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <h2>Ocorreu um erro ao carregar a landing page.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', textAlign: 'left', maxWidth: 800, margin: '1rem auto' }}>
            {String(this.state.error && (this.state.error.stack || this.state.error))}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

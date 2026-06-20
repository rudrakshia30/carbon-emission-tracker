/**
 * ErrorBoundary — React error boundary that catches render-time errors
 * and displays a friendly fallback UI instead of a blank screen.
 *
 * Usage:
 *   <ErrorBoundary fallback={<p>Something went wrong</p>}>
 *     <MyComponent />
 *   </ErrorBoundary>
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to console.error (allowed by our ESLint rules) — swap for Sentry etc. in production
    console.error('[CarbonTwin] Unhandled render error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            padding: '32px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '16px',
            color: '#f87171',
            textAlign: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '2rem' }}>⚠️</span>
          <strong>Something went wrong in this section.</strong>
          <p style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '8px',
              padding: '8px 20px',
              border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: '8px',
              background: 'transparent',
              color: '#f87171',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

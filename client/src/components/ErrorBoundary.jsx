import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error('Unexpected application error:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="page-shell">
        <div className="card error-card">
          <h1>Something went wrong</h1>
          <p className="muted">This page could not be displayed. Reload to try again.</p>
          <button type="button" className="primary-button" onClick={this.handleReload}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to analytics
    AnalyticsService.logError({
      type: 'component_error',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Optional: Send error report to monitoring service
    this.logErrorToMonitoringService(error, errorInfo);
  }

  private logErrorToMonitoringService(error: Error, errorInfo: ErrorInfo) {
    // Implement additional error logging or reporting logic
    console.error('Unhandled error:', error, errorInfo);
  }

  handleRecovery = () => {
    // Reset the error state, allowing component to recover
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback or default error UI
      return this.props.fallback ? (
        <>{this.props.fallback}</>
      ) : (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>We're sorry for the inconvenience. Please try again or contact support.</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
          </details>
          <button onClick={this.handleRecovery}>Try Again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
"use client";

import React from 'react';
import { Button } from '../components/ui/button-ui.component';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card-ui.component';

interface Props {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

      // Check for specific errors that might indicate auth problems
  if (error.message.includes('auth') || error.message.includes('firebase')) {
    // Attempt to refresh the page after a short delay
    setTimeout(() => {
      window.location.reload();
    }, 3000);
  }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                We apologize for the inconvenience. The application has encountered an unexpected error.
              </p>
              {this.state.error && (
                <pre className="p-2 overflow-auto text-xs bg-gray-100 rounded">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex space-x-2">
                <Button onClick={this.handleReset}>
                  Return to Home
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
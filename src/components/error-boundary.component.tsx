"use client";

import React from 'react';
import { Button } from '@/components/ui/button-ui.component';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card-ui.component';

interface Props {
  children: React.ReactNode;
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
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                We apologize for the inconvenience. The application has encountered an unexpected error.
              </p>
              {this.state.error && (
                <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
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
import React, { Component, ErrorInfo } from 'react';
import { AnalyticsService } from '../../services/analytics.service';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class GameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Game error:', error, errorInfo);

        // Track error in analytics
        AnalyticsService.trackEvent('game_error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                    <div className="p-8 bg-white rounded-lg shadow-md max-w-md">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            Oops! Something went wrong
                        </h2>
                        <p className="text-gray-600 mb-4">
                            We're sorry, but there was an error in the game. Please try:
                        </p>
                        <ul className="list-disc pl-5 mb-4 text-gray-600">
                            <li>Refreshing the page</li>
                            <li>Clearing your browser cache</li>
                            <li>Signing out and back in</li>
                        </ul>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
                            >
                                Refresh Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Return Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
import React, { Component, ErrorInfo } from 'react';
import { AnalyticsService } from '../../services/analytics.service';
import { GuestSessionService } from '../../services/guest-session.service';
import { clearGameState } from '../../utils/storage.utils';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    isGuest?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorType: 'session' | 'game' | 'network' | 'unknown';
}

export class GameErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorType: 'unknown'
        };
    }

    static getDerivedStateFromError(error: Error): State {
        // Categorize error type
        let errorType: 'session' | 'game' | 'network' | 'unknown' = 'unknown';
        
        if (error.message.includes('Guest session expired')) {
            errorType = 'session';
        } else if (error.message.includes('network')) {
            errorType = 'network';
        } else if (error.message.includes('game')) {
            errorType = 'game';
        }

        return {
            hasError: true,
            error,
            errorType
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('Game error:', error, errorInfo);

        // Track error in analytics
        AnalyticsService.trackEvent('game_error', {
            error: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            errorType: this.state.errorType,
            isGuest: this.props.isGuest
        });

        // Handle session expiration
        if (this.state.errorType === 'session' && this.props.isGuest) {
            GuestSessionService.clearSession();
            clearGameState();
        }

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);
    }

    private getErrorMessage(): { title: string; message: string; actions: { label: string; handler: () => void }[] } {
        switch (this.state.errorType) {
            case 'session':
                return {
                    title: 'Guest Session Expired',
                    message: 'Your guest session has expired. To continue playing and save your progress, you can sign up for a free account.',
                    actions: [
                        {
                            label: 'Sign Up',
                            handler: () => window.location.href = '/signup'
                        },
                        {
                            label: 'Continue as Guest',
                            handler: () => window.location.reload()
                        }
                    ]
                };
            case 'network':
                return {
                    title: 'Connection Error',
                    message: 'Please check your internet connection and try again.',
                    actions: [
                        {
                            label: 'Retry',
                            handler: () => window.location.reload()
                        }
                    ]
                };
            default:
                return {
                    title: 'Oops! Something went wrong',
                    message: 'We\'re sorry, but there was an error in the game. Please try:',
                    actions: [
                        {
                            label: 'Refresh Page',
                            handler: () => window.location.reload()
                        },
                        {
                            label: 'Return Home',
                            handler: () => window.location.href = '/'
                        }
                    ]
                };
        }
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const errorConfig = this.getErrorMessage();

            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
                    <div className="p-8 bg-white rounded-lg shadow-md max-w-md">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">
                            {errorConfig.title}
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {errorConfig.message}
                        </p>
                        {this.state.errorType !== 'session' && (
                            <ul className="list-disc pl-5 mb-4 text-gray-600">
                                <li>Refreshing the page</li>
                                <li>Clearing your browser cache</li>
                                <li>Signing out and back in</li>
                            </ul>
                        )}
                        <div className="flex justify-center gap-4">
                            {errorConfig.actions.map((action, index) => (
                                <button
                                    key={index}
                                    onClick={action.handler}
                                    className={`px-4 py-2 rounded ${
                                        index === 0 
                                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                                            : 'bg-gray-500 text-white hover:bg-gray-600'
                                    }`}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
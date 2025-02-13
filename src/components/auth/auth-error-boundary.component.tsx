// src/components/auth/auth-error-boundary.component.tsx
import React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class AuthErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Auth error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                        <h1 className="text-2xl font-bold text-red-600 text-center">Authentication Error</h1>
                        <p className="mt-2 text-gray-600 text-center">{this.state.error?.message}</p>
                        <div className="flex justify-center">
                            <button
                                className="mt-4 px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
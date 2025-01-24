import { analyticsService } from 'src/services/analytics.service';

export class ErrorHandler {
  static handleError(error: Error, context?: string) {
    // Log to console
    console.error(`Error in ${context}:`, error);

    // Track in analytics
    analyticsService.logError({
      type: 'application_error',
      message: error.message,
      stack: error.stack,
      context
    });

    // Potential UI notification or error reporting
    this.notifyUser(error.message);
  }

  private static notifyUser(message: string) {
    // Could integrate with a toast notification system
    // Example: toast.error(message);
    console.warn('User Notification:', message);
  }

  static async safeAsyncCall<T>(
    asyncFn: () => Promise<T>,
    context?: string
  ): Promise<T | null> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handleError(error as Error, context);
      return null;
    }
  }
}
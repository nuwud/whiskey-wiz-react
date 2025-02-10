import { doc, setDoc,   } from 'firebase/firestore';
import { db } from '../config/firebase'

interface RetryConfig {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableErrors?: Array<string | RegExp>;
};

const DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableErrors: [
        'network error', 'timeout', 'unavailable', 'internal',
        /failed to fetch/i, /network request failed/i, /operation-not-allowed/i,
        /quota exceeded/i, /timeout/i, /user-disabled/i,
        /permission-denied/i, /unavailable/i, /deadline-exceeded/i,
        /canceled/i, /resource-exhausted/i
    ]
};

export async function retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_CONFIG
): Promise<T> {
    let attempt = 0;
    let delay = config.initialDelay || 1000;

    while (attempt < (config.maxAttempts || 3)) {
        try {
            return await operation();
        } catch (error: any) {
            const errorMessage = error?.message || error?.toString() || 'Unknown error';

            if (!config.retryableErrors?.some((pattern) =>
                typeof pattern === 'string'
                    ? errorMessage.includes(pattern)
                    : pattern.test(errorMessage)
            )) {
                throw error;
            }

            attempt++;
            console.warn(`Retrying operation (${attempt}/${config.maxAttempts}) due to:`, errorMessage);

            if (attempt >= (config.maxAttempts || 3)) {
                throw new Error(`Max retry attempts reached: ${errorMessage}`);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
            delay = Math.min(delay * (config.backoffFactor || 2), config.maxDelay || 10000);
        }
    }
    throw new Error('Operation failed after max retries');
};

export { DEFAULT_CONFIG };

export function withRetry<T>(operation: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
    return retryOperation(operation, { ...DEFAULT_CONFIG, maxAttempts });
}

export const retryQueue: Array<{ userId: string; quarterId: string; state: any; attempts: number; }> = [];

const COLLECTION_NAME = 'userGameStates';

export const addToRetryQueue = async (userId: string, quarterId: string, state: any) => {
    retryQueue.push({ userId, quarterId, state, attempts: 0 });
    await processRetryQueue();
};

export const processRetryQueue = async () => {
    if (retryQueue.length === 0) return;
    const MAX_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;
    for (const item of [...retryQueue]) {
        if (item.attempts >= MAX_ATTEMPTS) {
            console.error('Max retry attempts reached for state save', { userId: item.userId, quarterId: item.quarterId });
            retryQueue.splice(retryQueue.indexOf(item), 1);
            continue;
        }
        try {
            const docRef = doc(db, COLLECTION_NAME, item.userId);
            await setDoc(docRef, { userId: item.userId, quarterId: item.quarterId, lastSavedState: item.state, timestamp: new Date() }, { merge: true });
            retryQueue.splice(retryQueue.indexOf(item), 1);
        } catch (error) {
            console.error('Retry attempt failed:', error);
            item.attempts++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }
};

export function retryable(config?: RetryConfig) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args: any[]) {
            return retryOperation(() => originalMethod.apply(this, args), config);
        };
        return descriptor;
    };
};

export async function retryBatch<T, R>(items: T[], operation: (item: T) => Promise<R>, config?: RetryConfig): Promise<R[]> {
    return Promise.all(items.map(item => retryOperation(() => operation(item), config)));
};

export async function retrySequence<T>(operations: Array<() => Promise<T>>, config?: RetryConfig): Promise<T[]> {
    const results: T[] = [];
    for (const operation of operations) {
        const result = await retryOperation(operation, config);
        results.push(result);
    }
    return results;
};

export type { RetryConfig };

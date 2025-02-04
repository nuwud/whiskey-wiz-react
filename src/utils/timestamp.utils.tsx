import { Timestamp } from 'firebase/firestore';

export const toFirebaseTimestamp = (date: Date | string | number): Timestamp => {
    if (date instanceof Date) {
        return Timestamp.fromDate(date);
    }
    if (typeof date === 'string') {
        return Timestamp.fromDate(new Date(date));
    }
    return Timestamp.fromMillis(date);
};

export const fromFirebaseTimestamp = (timestamp: any): Date => {
    if (!timestamp) return new Date(); // Default to current date
    if (timestamp instanceof Timestamp) return timestamp.toDate();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp.seconds) return new Date(timestamp.seconds * 1000);
    return new Date(timestamp);
};
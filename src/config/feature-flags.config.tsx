import { Component, useContext } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../config/firebase'; // Ensure firebaseApp is your initialized Firebase app

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
import { FeatureContext, FeatureContextType } from '../contexts/feature.context';

const CACHE_KEY = 'feature_flags_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedFlags {
    flags: FeatureFlags;
    timestamp: number;
}

const getCachedFlags = (): FeatureFlags | null => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { flags, timestamp }: CachedFlags = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(CACHE_KEY);
        return null;
    }

    return flags;
};

const cacheFlags = (flags: FeatureFlags): void => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
        flags,
        timestamp: Date.now()
    }));
};

export class FeatureFlagComponent extends Component<FeatureFlagProps> {
    render() {
        const { featureFlag, children } = this.props;

        if (!featureFlag.enabledFeature) {
            return null;
        }

        return children;
    }

    async componentDidMount() {
        try {
            // Check cache first
            const cached = getCachedFlags();
            if (cached) {
                this.setState({ flags: cached });
                return;
            }

            // Fetch from Firestore if not cached
            const flagsDoc = await getDoc(doc(db, 'features', 'flags'));
            if (flagsDoc.exists()) {
                const flags = flagsDoc.data() as FeatureFlags;
                cacheFlags(flags);
                this.setState({ flags });
            }
        } catch (error) {
            console.error('Error fetching feature flags:', error);
        }
    }
}

interface FeatureFlagProps {
    featureFlag: FeatureFlags;
    children: React.ReactNode;
}

export interface FeatureFlags {
    enabledFeature: boolean;
    'advanced-stats': boolean;
    GUEST_MODE: boolean;
    MACHINE_LEARNING: boolean;
    SOCIAL_FEATURES: boolean;
    SHOPIFY_INTEGRATION: boolean;
}

export const featureFlags: FeatureFlags = {
    enabledFeature: true,
    GUEST_MODE: false,
    MACHINE_LEARNING: false,
    SOCIAL_FEATURES: true,
    SHOPIFY_INTEGRATION: false,
    'advanced-stats': false,
};

export const enableFeature = (flag: keyof FeatureFlags): void => {
    featureFlags[flag] = true;
};

export const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return featureFlags[flag];
};

export const handleToggle = async (id: string, enabled: boolean): Promise<void> => {
    try {
        const featureRef = doc(db, 'features', id);
        await updateDoc(featureRef, {
            enabled,
            updatedAt: new Date().toISOString()
        });

        // Update local state
        featureFlags[id as keyof FeatureFlags] = enabled;

    } catch (error) {
        console.error('Failed to update feature flag:', error);
        // Revert local state if server update fails
        featureFlags[id as keyof FeatureFlags] = !enabled;
        throw error;
    }
};

export const useFeatures = (): FeatureContextType => {
    const context = useContext(FeatureContext);
    if (context === undefined) {
        throw new Error('useFeatures must be used within a FeatureProvider');
    }

    return context;
};
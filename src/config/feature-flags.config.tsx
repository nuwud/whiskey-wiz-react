import { Component } from 'react';
import { FeatureFlags, defaultFeatures } from '@/contexts/feature.context';

export class FeatureFlagComponent extends Component<FeatureFlagProps> {
    render() {
        const { featureFlag, children } = this.props;

        if (!featureFlag.enabled) {
            return null;
        }

        return children;
    }

    componentDidMount() {
        // Fetch and update feature flag state from server or cache
    }
}

interface FeatureFlagProps {
    featureFlag: FeatureFlag;
    children: React.ReactNode;
}

interface FeatureFlag {
    key: string;
    enabled: boolean;
    description?: string;
}


export const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return defaultFeatures[flag];
};

export type { FeatureFlags };
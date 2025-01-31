import { Component } from 'react';

export class FeatureFlagComponent extends Component<FeatureFlagProps> {
    render() {
        const { featureFlag, children } = this.props;

        if (!featureFlag.enabledFeature) {
            return null;
        }

        return children;
    }

    componentDidMount() {
        // Fetch and update feature flag state from server or cache
    }
}

interface FeatureFlagProps {
    featureFlag: FeatureFlags;
    children: React.ReactNode;
}

interface FeatureFlags {
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
    // Add more feature flags here
    // Example: 'VIP_ACCESS': false
};

export const enableFeature = (flag: keyof FeatureFlags): void => {
    featureFlags[flag] = true;
};

export const isEnabled = (flag: keyof FeatureFlags): boolean => {
    return featureFlags[flag];
};

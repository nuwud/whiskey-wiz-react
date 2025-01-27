import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { shopifyService } from '@/services/shopify-integration.service';
import { QuarterProvider } from '@/contexts/quarter.context';
import { AuthProvider } from '@/contexts/auth.context';
import { FeatureProvider } from '@/contexts/feature.context';
import { GameBoard } from '@/components/game/game-board.component';
import { AnalyticsService } from '@/services/analytics.service';

type Theme = 'light' | 'dark';
type PageType = 'product' | 'collection' | 'page';

interface WhiskeyWizEmbedOptions {
  quarterId?: string;
  theme?: Theme;
  width?: string;
  height?: string;
  containerStyle?: React.CSSProperties;
}

interface PageInfo {
  quarterId: string;
  pageType: PageType;
  productId?: string;
}

declare global {
  interface Window {
    WhiskeyWizEmbed?: {
      mount: (el: HTMLElement, options?: WhiskeyWizEmbedOptions) => () => void;
    };
    Shopify?: {
      shop: string;
      theme?: {
        id: string;
        name: string;
      };
    };
  }
}

const DEFAULT_CONFIG = {
  theme: 'light' as Theme,
  width: '100%',
  height: 'auto',
  maxWidth: '1200px',
};

const WhiskeyWizEmbed: React.FC<{ options: WhiskeyWizEmbedOptions }> = ({ options }) => {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeEmbed = async () => {
      try {
        setIsLoading(true);

        // Get page info from Shopify
        if (!options.quarterId) {
          throw new Error('No quarter ID specified');
        }

        const productId = new URLSearchParams(window.location.search).get('product_id') ?? undefined;
        const pageType: PageType = productId ? 'product' : 'page';

        // If on product page, check for existing challenge
        if (pageType === 'product' && productId) {
          const hasChallenge = shopifyService.hasEmbeddedChallenge(productId);
          if (hasChallenge) {
            throw new Error('Challenge already embedded in this product');
          }
        }

        setPageInfo({
          quarterId: options.quarterId,
          pageType,
          productId
        });

        AnalyticsService.trackError('Shopify embed initialized', 'shopify_embed', productId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize game';
        setError(errorMessage);
        AnalyticsService.trackError(errorMessage, 'shopify_embed');
      } finally {
        setIsLoading(false);
      }
    };

    initializeEmbed();

    return () => {
      // Cleanup if needed
      const { productId } = pageInfo || {};
      if (productId) {
        shopifyService.removeChallengeFromProduct(productId);
      }
    };
  }, [options.quarterId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="text-sm text-red-700 text-center">{error}</div>
      </div>
    );
  }

  if (!pageInfo?.quarterId) {
    return (
      <div className="rounded-lg bg-amber-50 p-4">
        <div className="text-sm text-amber-700 text-center">
          No quarter ID specified for this game.
        </div>
      </div>
    );
  }

  const containerStyles: React.CSSProperties = {
    width: options.width || DEFAULT_CONFIG.width,
    height: options.height || DEFAULT_CONFIG.height,
    maxWidth: DEFAULT_CONFIG.maxWidth,
    margin: '0 auto',
    ...(options.containerStyle || {})
  };

  // In the return statement of WhiskeyWizEmbed
  return (
    <div className={`whiskey-wiz-embed ${options.theme || DEFAULT_CONFIG.theme}`} style={containerStyles}>
      <AuthProvider>
        <FeatureProvider>
          <QuarterProvider>
            <GameBoard />
          </QuarterProvider>
        </FeatureProvider>
      </AuthProvider>
    </div>
  );
};

// Mount function for Shopify liquid
const mountEmbed = (el: HTMLElement, options: WhiskeyWizEmbedOptions = {}): (() => void) => {
  const container = document.createElement('div');
  container.className = 'whiskey-wiz-embed-container';
  el.appendChild(container);

  const root = createRoot(container);
  root.render(<WhiskeyWizEmbed options={options} />);

  // Return cleanup function
  return () => {
    root.unmount();
    el.removeChild(container);
  };
};

// Export for Shopify liquid usage
if (typeof window !== 'undefined') {
  window.WhiskeyWizEmbed = {
    mount: mountEmbed
  };
}

export default WhiskeyWizEmbed;
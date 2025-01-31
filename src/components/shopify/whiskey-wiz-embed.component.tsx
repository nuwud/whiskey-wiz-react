import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { shopifyService } from '../../services/shopify-integration.service';
import { QuarterProvider } from '../../contexts/quarter.context';
import { AuthProvider } from '../../contexts/auth.context';
import { FeatureProvider } from '../../contexts/feature.context';
import { GameBoard } from '../../components/game/game-board.component';
import { AnalyticsService } from '../../services/analytics.service';

type Theme = 'light' | 'dark';
type PageType = 'product' | 'collection' | 'page';

export interface WhiskeyWizEmbedOptions {
  quarterId?: string;
  theme?: Theme;
  size?: 'small' | 'medium' | 'large';
  containerId?: string;
  apiKey?: string;
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

interface WhiskeyWizEmbedProps {
  containerId?: string;
  theme?: Theme;
  size?: 'small' | 'medium' | 'large';
  quarterId?: string;
  apiKey?: string;
}

const WhiskeyWizEmbed: React.FC<WhiskeyWizEmbedProps> = ({
  containerId,
  theme = DEFAULT_CONFIG.theme,
  size = 'medium',
  quarterId
}) => {
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeEmbed = async () => {
      try {
        setIsLoading(true);
        if (!quarterId) {
          throw new Error('No quarter ID specified');
        }

        const productId = new URLSearchParams(window.location.search).get('product_id') ?? undefined;
        const pageType: PageType = productId ? 'product' : 'page';

        if (pageType === 'product' && productId) {
          const hasChallenge = await shopifyService.hasEmbeddedChallenge(productId);
          if (hasChallenge) {
            throw new Error('Challenge already embedded in this product');
          }
        }

        setPageInfo({
          quarterId,
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
      const { productId } = pageInfo || {};
      if (productId) {
        shopifyService.removeChallengeFromProduct(productId);
      }
    };
  }, [quarterId]);

  if (isLoading) return <div className="whiskey-wiz-spinner" />;
  if (error) return <div className="whiskey-wiz-error">{error}</div>;
  if (!pageInfo?.quarterId) {
    return (
      <div className="rounded-lg bg-amber-50 p-4">
        <div className="text-sm text-amber-700 text-center">
          No quarter ID specified for this game.
        </div>
      </div>
    );
  }

  return (
    <div
      id={containerId}
      className={`whiskey-wiz-embed ${theme} ${size}`}
    >
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
  root.render(<WhiskeyWizEmbed {...options} />);

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
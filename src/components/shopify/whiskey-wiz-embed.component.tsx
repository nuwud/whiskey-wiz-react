import React, { useEffect, useState } from 'react';
import { shopifyService } from 'src/services/shopify-integration.service';
import { QuarterProvider } from 'src/contexts/quarter.context';
import { AuthProvider } from 'src/contexts/auth.context';
import { FeatureProvider } from 'src/contexts/feature.context';
import { GameBoard } from '../game/game-board.component';

declare global {
  interface Window {
    WhiskeyWizEmbed?: {
      mount: (el: HTMLElement, options?: WhiskeyWizEmbedOptions) => void;
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

interface WhiskeyWizEmbedOptions {
  quarterCode?: string;
  theme?: 'light' | 'dark';
  width?: string;
  height?: string;
}

function WhiskeyWizEmbed({ options = {} }: { options: WhiskeyWizEmbedOptions }) {
  const [pageInfo, setPageInfo] = useState<{
    quarterCode: string | null;
    pageType: 'product' | 'collection' | 'page';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeEmbed = async () => {
      try {
        // Get page info from Shopify
        const info = await shopifyService.getEmbedLocation();
        setPageInfo({
          quarterCode: options.quarterCode || info.quarterCode,
          pageType: info.pageType
        });
      } catch (err) {
        setError('Failed to initialize game');
        console.error('Initialization error:', err);
      }
    };

    initializeEmbed();
  }, [options.quarterCode]);

  if (error) {
    return (
      <div className="text-red-600 text-center p-4">
        {error}
      </div>
    );
  }

  if (!pageInfo?.quarterCode) {
    return (
      <div className="text-amber-600 text-center p-4">
        No quarter code specified for this game.
      </div>
    );
  }

  return (
    <div className={`whiskey-wiz-embed ${options.theme || 'light'}`}
      style={{
        width: options.width || '100%',
        height: options.height || 'auto',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
      <AuthProvider>
        <FeatureProvider>
          <QuarterProvider code={pageInfo.quarterCode}>
            <GameBoard />
          </QuarterProvider>
        </FeatureProvider>
      </AuthProvider>
    </div>
  );
}

// Mount function for Shopify liquid
function mountEmbed(el: HTMLElement, options: WhiskeyWizEmbedOptions = {}) {
  const root = document.createElement('div');
  el.appendChild(root);

  // Create and render the React component
  const ReactDOM = require('react-dom');
  ReactDOM.render(
    <WhiskeyWizEmbed options={options} />,
    root
  );

  // Return cleanup function
  return () => {
    ReactDOM.unmountComponentAtNode(root);
    el.removeChild(root);
  };
}

// Export for Shopify liquid usage
if (typeof window !== 'undefined') {
  window.WhiskeyWizEmbed = {
    mount: mountEmbed
  };
}

export default WhiskeyWizEmbed;
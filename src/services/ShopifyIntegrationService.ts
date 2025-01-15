import { AnalyticsService } from './AnalyticsService';

export interface ShopifyProductMetadata {
  id: string;
  quarterId?: string;
  challengeEmbedded: boolean;
  whiskeySampleDetails?: {
    name: string;
    age: number;
    proof: number;
  };
}

export class ShopifyIntegrationService {
  private shopifyMetadataCollection: Record<string, ShopifyProductMetadata> = {};

  // Advanced Shopify product challenge embedding
  embedChallengeInProduct(productId: string, challengeData: any): void {
    try {
      const existingMetadata = this.shopifyMetadataCollection[productId] || {};
      
      const updatedMetadata: ShopifyProductMetadata = {
        ...existingMetadata,
        id: productId,
        challengeEmbedded: true,
        quarterId: challengeData.quarterId,
        whiskeySampleDetails: challengeData.whiskeySample
      };

      this.shopifyMetadataCollection[productId] = updatedMetadata;

      // Inject challenge web component
      this.injectWebComponent(productId, challengeData);

      // Track embedding analytics
      AnalyticsService.trackUserEngagement('shopify_challenge_embedded', {
        productId,
        quarterId: challengeData.quarterId
      });
    } catch (error) {
      console.error('Failed to embed challenge in Shopify product', error);
    }
  }

  private injectWebComponent(productId: string, challengeData: any): void {
    // Create a custom web component for Shopify product page
    class WhiskeyChallenge extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = `
            <style>
              .whiskey-challenge {
                border: 1px solid #e0e0e0;
                padding: 15px;
                margin: 10px 0;
                border-radius: 5px;
              }
            </style>
            <div class="whiskey-challenge">
              <h3>Whiskey Wiz Challenge</h3>
              <p>Quarter: ${challengeData.quarterId}</p>
              <p>Whiskey: ${challengeData.whiskeySample?.name}</p>
            </div>
          `;
        }
      }
    }

    // Register custom element if not already defined
    if (!customElements.get('whiskey-challenge')) {
      customElements.define('whiskey-challenge', WhiskeyChallenge);
    }

    // Find Shopify product element and append challenge
    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (productElement) {
      const challengeElement = document.createElement('whiskey-challenge');
      productElement.appendChild(challengeElement);
    }
  }

  // Advanced product metadata tracking
  getProductChallengeMetadata(productId: string): ShopifyProductMetadata | undefined {
    return this.shopifyMetadataCollection[productId];
  }

  // Clean up challenge embedding
  removeChallengeFromProduct(productId: string): void {
    try {
      // Remove web component
      const challengeElement = document.querySelector(`whiskey-challenge[data-product-id="${productId}"]`);
      challengeElement?.remove();

      // Remove metadata
      delete this.shopifyMetadataCollection[productId];

      AnalyticsService.trackUserEngagement('shopify_challenge_removed', { productId });
    } catch (error) {
      console.error('Failed to remove Shopify challenge', error);
    }
  }
}
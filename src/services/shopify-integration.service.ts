import { analyticsService } from '@/services/analytics.service';

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
      this.injectWebComponent(productId, challengeData);
      
      analyticsService.trackError('Shopify challenge embedded', 'shopify_integration');
    } catch (error) {
      console.error('Failed to embed challenge in Shopify product', error);
      analyticsService.trackError('Failed to embed Shopify challenge', 'shopify_integration');
    }
  }

  private injectWebComponent(productId: string, challengeData: any): void {
    class WhiskeyChallenge extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = `
            <div class="whiskey-challenge rounded-lg bg-white p-4 shadow-md">
              <h3 class="text-xl font-bold mb-2">Whiskey Wiz Challenge</h3>
              <p class="text-gray-600">Quarter: ${challengeData.quarterId}</p>
              <p class="text-gray-600">Whiskey: ${challengeData.whiskeySample?.name || 'Unknown'}</p>
            </div>
          `;
        }
      }
    }

    if (!customElements.get('whiskey-challenge')) {
      customElements.define('whiskey-challenge', WhiskeyChallenge);
    }

    const productElement = document.querySelector(`[data-product-id="${productId}"]`);
    if (productElement) {
      const challengeElement = document.createElement('whiskey-challenge');
      productElement.appendChild(challengeElement);
    }
  }

  getProductChallengeMetadata(productId: string): ShopifyProductMetadata | undefined {
    return this.shopifyMetadataCollection[productId];
  }

  removeChallengeFromProduct(productId: string): void {
    try {
      const challengeElement = document.querySelector(`whiskey-challenge[data-product-id="${productId}"]`);
      challengeElement?.remove();
      delete this.shopifyMetadataCollection[productId];
    } catch (error) {
      console.error('Failed to remove Shopify challenge', error);
      analyticsService.trackError('Failed to remove Shopify challenge', 'shopify_integration');
    }
  }
}

export const shopifyService = new ShopifyIntegrationService();
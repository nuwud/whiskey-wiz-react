import { AnalyticsService } from '@/services/analytics.service';
import { WhiskeySample } from '@/types';

export interface ShopifyProductMetadata {
  id: string;
  quarterId?: string;
  challengeEmbedded: boolean;
  whiskeySampleDetails?: Omit<WhiskeySample, 'id' | 'notes' | 'hints'>;
}

interface ChallengeData {
  quarterId: string;
  whiskeySample: WhiskeySample;
  difficulty?: string;
}

export class ShopifyIntegrationService {
  private shopifyMetadataCollection: Map<string, ShopifyProductMetadata> = new Map();

  embedChallengeInProduct(productId: string, challengeData: ChallengeData): void {
    try {
      const existingMetadata = this.shopifyMetadataCollection.get(productId) || {
        id: productId,
        challengeEmbedded: false
      };

      const updatedMetadata: ShopifyProductMetadata = {
        ...existingMetadata,
        challengeEmbedded: true,
        quarterId: challengeData.quarterId,
        whiskeySampleDetails: {
          name: challengeData.whiskeySample.name,
          age: challengeData.whiskeySample.age,
          proof: challengeData.whiskeySample.proof,
          mashbillType: challengeData.whiskeySample.mashbillType,
          distillery: '',
          description: challengeData.whiskeySample.description
        }
      };

      this.shopifyMetadataCollection.set(productId, updatedMetadata);
      this.injectWebComponent(productId, challengeData);

      AnalyticsService.trackError('Shopify challenge embedded', 'shopify_integration');
    } catch (error) {
      console.error('Failed to embed challenge in Shopify product:', error);
      AnalyticsService.trackError('Failed to embed Shopify challenge', 'shopify_integration');
    }
  }

  getProductChallengeMetadata(productId: string): ShopifyProductMetadata | undefined {
    return this.shopifyMetadataCollection.get(productId);
  }

  removeChallengeFromProduct(productId: string): void {
    try {
      this.removeWebComponent(productId);
      this.shopifyMetadataCollection.delete(productId);
    } catch (error) {
      console.error('Failed to remove Shopify challenge:', error);
      AnalyticsService.trackError('Failed to remove Shopify challenge', 'shopify_integration');
    }
  }

  hasEmbeddedChallenge(productId: string): boolean {
    const metadata = this.shopifyMetadataCollection.get(productId);
    return metadata?.challengeEmbedded || false;
  }

  private injectWebComponent(productId: string, challengeData: ChallengeData): void {
    if (!customElements.get('whiskey-challenge')) {
      class WhiskeyChallenge extends HTMLElement {
        constructor() {
          super();
          this.attachShadow({ mode: 'open' });
        }

        connectedCallback() {
          if (this.shadowRoot) {
            this.shadowRoot.innerHTML = `
              <style>
                :host {
                  display: block;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                .whiskey-challenge {
                  background: white;
                  border-radius: 0.5rem;
                  padding: 1rem;
                  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                  margin: 1rem 0;
                }
                .title {
                  font-size: 1.25rem;
                  font-weight: 600;
                  margin-bottom: 0.5rem;
                  color: #111827;
                }
                .detail {
                  font-size: 0.875rem;
                  color: #4B5563;
                  margin: 0.25rem 0;
                }
              </style>
              <div class="whiskey-challenge">
                <h3 class="title">Whiskey Wiz Challenge</h3>
                <p class="detail">Quarter: ${challengeData.quarterId}</p>
                <p class="detail">Whiskey: ${challengeData.whiskeySample.name}</p>
                ${challengeData.difficulty ?
                `<p class="detail">Difficulty: ${challengeData.difficulty}</p>` :
                ''}
              </div>
            `;
          }
        }
      }

      customElements.define('whiskey-challenge', WhiskeyChallenge);
    }

    requestAnimationFrame(() => {
      const productElement = document.querySelector(`[data-product-id="${productId}"]`);
      if (productElement) {
        const challengeElement = document.createElement('whiskey-challenge');
        challengeElement.setAttribute('data-product-id', productId);
        productElement.appendChild(challengeElement);
      }
    });
  }

  private removeWebComponent(productId: string): void {
    const challengeElement = document.querySelector(
      `whiskey-challenge[data-product-id="${productId}"]`
    );
    if (challengeElement?.parentNode) {
      challengeElement.parentNode.removeChild(challengeElement);
    }
  }
}

export const shopifyService = new ShopifyIntegrationService();
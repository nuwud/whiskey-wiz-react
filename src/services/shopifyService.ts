import { WhiskeySample } from '../types/game';

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  vendor: string;
  metafields: {
    age?: string;
    proof?: string;
    mashbill_type?: string;
    description?: string;
  };
}

interface ShopifyPageInfo {
  pageId: string;
  pagePath: string;
  quarterCode: string | null;
  pageType: 'product' | 'collection' | 'page';
}

class ShopifyService {
  private baseUrl: string;
  private accessToken: string;
  private shopDomain: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_SHOPIFY_STORE_URL;
    this.accessToken = import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN;
    this.shopDomain = import.meta.env.VITE_SHOPIFY_SHOP_DOMAIN;
  }

  async getProducts(): Promise<ShopifyProduct[]> {
    const response = await fetch(
      `${this.baseUrl}/admin/api/2024-01/products.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const data = await response.json();
    return data.products;
  }

  async getProductMetafields(productId: string): Promise<any> {
    const response = await fetch(
      `${this.baseUrl}/admin/api/2024-01/products/${productId}/metafields.json`,
      {
        headers: {
          'X-Shopify-Access-Token': this.accessToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch product metafields');
    }
    
    const data = await response.json();
    return data.metafields;
  }

  convertToSample(product: ShopifyProduct): Partial<WhiskeySample> {
    return {
      name: product.title,
      distillery: product.vendor,
      age: parseInt(product.metafields.age || '0'),
      proof: parseFloat(product.metafields.proof || '0'),
      mashbillType: product.metafields.mashbill_type || '',
      description: product.metafields.description,
      shopifyId: product.id,
      shopifyHandle: product.handle
    };
  }

  async getEmbedLocation(): Promise<ShopifyPageInfo> {
    // Get current page info from Shopify Liquid
    const pageId = window.Shopify?.page?.id;
    const pagePath = window.location.pathname;
    const pageType = this.determinePageType(pagePath);
    
    // Extract quarter code from URL or custom attribute
    // Format: MMYY (e.g., 0324 for March 2024)
    const quarterCode = this.extractQuarterCode(pagePath) || 
                       document.querySelector('[data-quarter-code]')?.getAttribute('data-quarter-code') ||
                       null;

    return {
      pageId,
      pagePath,
      quarterCode,
      pageType
    };
  }

  private determinePageType(path: string): 'product' | 'collection' | 'page' {
    if (path.includes('/products/')) return 'product';
    if (path.includes('/collections/')) return 'collection';
    return 'page';
  }

  private extractQuarterCode(path: string): string | null {
    // Try to extract MMYY format from URL
    const quarterMatch = path.match(/\/quarters\/(\d{4})/);
    if (quarterMatch) return quarterMatch[1];

    // Try to extract from query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const quarterParam = urlParams.get('quarter');
    if (quarterParam?.match(/^\d{4}$/)) return quarterParam;

    return null;
  }

  async validateMetafields(productId: string): Promise<{
    isValid: boolean;
    missing: string[];
  }> {
    const metafields = await this.getProductMetafields(productId);
    const requiredFields = ['age', 'proof', 'mashbill_type'];
    const missing = requiredFields.filter(field => 
      !metafields.some((m: any) => m.key === field && m.value)
    );

    return {
      isValid: missing.length === 0,
      missing
    };
  }

  async createQuarterCode(date: Date = new Date()): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${month}${year}`;
  }
}

export const shopifyService = new ShopifyService();
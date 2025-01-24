import React, { useEffect } from 'react';
import { useAuth } from 'src/contexts/auth.context';

// Advanced Shopify Web Component Wrapper
const ShopifyIntegration: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    class WhiskeyWizElement extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({ mode: 'open' });
      }

      connectedCallback() {
        this.render();
      }

      render() {
        if (this.shadowRoot) {
          const container = document.createElement('div');
          container.innerHTML = `
            <style>
              /* Shopify-specific styling */
              .whiskey-wiz-container {
                max-width: 100%;
                margin: auto;
              }
            </style>
            <div class="whiskey-wiz-container">
              <h2>Whiskey Wiz Challenge</h2>
              <p>Embedded Whiskey Challenge</p>
            </div>
          `;
          this.shadowRoot.appendChild(container);
        }
      }

      disconnectedCallback() {
        // Cleanup logic
      }
    }

    // Define custom element if not already defined
    if (!customElements.get('whiskey-wiz')) {
      customElements.define('whiskey-wiz', WhiskeyWizElement);
    }

    return () => {
      // Cleanup custom element when component is unmounted
      customElements.delete('whiskey-wiz');
      // Cleanup logic when component is unmounted
    };
  }, []);

  return null;
};

export default ShopifyIntegration;
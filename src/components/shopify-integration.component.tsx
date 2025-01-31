import React, { useEffect } from 'react';
import { useAuth } from '../contexts/auth.context';

// Advanced Shopify Web Component Wrapper
export const ShopifyIntegration: React.FC = () => {
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
          const userGreeting = user ? `Welcome, ${user.displayName}!` : 'Welcome, Guest!';

          container.innerHTML = `
            <style>
              /* Shopify-specific styling */
              .whiskey-wiz-container {
                max-width: 100%;
                margin: auto;
              }
            </style>
            <div class="whiskey-wiz-container">
              <h2>${userGreeting}</h2>
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
      // Cleanup logic when component is unmounted
      try {
        document.querySelector('whiskey-wiz')?.remove();
      } catch (error) {
        console.error('Error cleaning up WhiskeyWiz component:', error);
      }
    };
  }, [user]); // Add user to dependencies

  return null;
};

export default ShopifyIntegration;
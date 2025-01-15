import React from 'react';
import { createRoot } from 'react-dom/client';
import GameContainer from '../components/game/GameContainer';

class WhiskeyWizGameElement extends HTMLElement {
  private root: ReturnType<typeof createRoot> | null = null;

  connectedCallback() {
    // Create a container for React app
    const container = document.createElement('div');
    this.appendChild(container);

    // Create React root
    this.root = createRoot(container);

    // Extract quarter ID from attribute
    const quarterId = this.getAttribute('quarter') || undefined;

    // Render React component
    this.root.render(
      React.createElement(GameContainer, { quarterId })
    );
  }

  disconnectedCallback() {
    // Clean up React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  // Optional: Support dynamic quarter changes
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'quarter' && oldValue !== newValue) {
      this.connectedCallback();
    }
  }

  static get observedAttributes() {
    return ['quarter'];
  }
}

// Register the custom element
customElements.define('whiskey-wiz-game', WhiskeyWizGameElement);

export default WhiskeyWizGameElement;
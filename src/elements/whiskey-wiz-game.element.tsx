import React from 'react';
import { createRoot } from 'react-dom/client';

interface GameContainerProps {
  quarterId?: string;
}

const GameContainer: React.FC<GameContainerProps> = ({ quarterId }) => {
  // Your component implementation here
  return (
    <div>
      {/* Game container */}
      <h1>Game Container</h1>
      <p>Quarter ID: {quarterId}</p>
    </div>
  );
};

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
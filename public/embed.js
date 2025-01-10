// BlindBarrels Embed Script
(function() {
  // Default configuration
  const defaultConfig = {
    theme: 'light',
    containerHeight: '600px',
    allowFullscreen: true,
    showNavigation: false
  };

  // Merge with user config
  const config = {
    ...defaultConfig,
    ...window.blindbarrelsConfig
  };

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .blindbarrels-container {
        width: 100%;
        height: ${config.containerHeight};
        border: none;
        border-radius: ${config.customStyles?.borderRadius || '4px'};
        overflow: hidden;
        ${config.customStyles?.border ? `border: ${config.customStyles.border};` : ''}
      }
      .blindbarrels-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
      }
      .blindbarrels-fullscreen {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 9999;
      }
    `;
    document.head.appendChild(style);
  }

  function createIframe() {
    const container = document.getElementById('blindbarrels-game');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'blindbarrels-wrapper';

    const iframe = document.createElement('iframe');
    iframe.className = 'blindbarrels-container';
    
    // Build the game URL with configuration
    const quarter = config.quarter === 'current' 
      ? getCurrentQuarter()
      : config.quarter;

    const params = new URLSearchParams({
      embedded: 'true',
      theme: config.theme,
      navigation: config.showNavigation ? '1' : '0'
    }).toString();

    iframe.src = `https://app.blindbarrels.com/game/${quarter}?${params}`;
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    // Handle fullscreen
    if (config.allowFullscreen) {
      setupFullscreenHandling(wrapper, iframe);
    }

    // Dispatch loaded event
    window.dispatchEvent(new CustomEvent('blindbarrels:loaded'));
  }

  function getCurrentQuarter() {
    const now = new Date();
    const quarter = Math.floor((now.getMonth() / 3)) + 1;
    return `Q${quarter}-${now.getFullYear()}`;
  }

  function setupFullscreenHandling(wrapper, iframe) {
    // Listen for messages from the game
    window.addEventListener('message', (event) => {
      if (event.origin !== 'https://app.blindbarrels.com') return;
      
      if (event.data.type === 'requestFullscreen') {
        wrapper.classList.add('blindbarrels-fullscreen');
      } else if (event.data.type === 'exitFullscreen') {
        wrapper.classList.remove('blindbarrels-fullscreen');
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wrapper.classList.contains('blindbarrels-fullscreen')) {
        wrapper.classList.remove('blindbarrels-fullscreen');
      }
    });
  }

  // Initialize
  injectStyles();
  createIframe();
})();

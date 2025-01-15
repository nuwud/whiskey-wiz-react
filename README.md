# BlindBarrels.com - Whiskey Tasting Game

## Quick Links
- [Store Owners: Add Game to Your Shopify Store](#shopify-setup)
- [Players: Play the Game](https://app.blindbarrels.com)
- [Documentation](docs/)

## Shopify Setup

Add the game to your Shopify store in 3 easy steps:

1. Go to your Shopify admin → Online Store → Themes → Customize
2. Add a Custom HTML section where you want the game
3. Copy and paste this code:

```html
<!-- BlindBarrels Game -->
<div 
  id="blindbarrels-game" 
  data-theme="light"
  data-height="600px"
></div>

<script>
  (function loadBlindBarrels() {
    const container = document.getElementById('blindbarrels-game');
    
    // Configuration from data attributes
    window.blindbarrelsConfig = {
      theme: container.getAttribute('data-theme') || 'light',
      containerHeight: container.getAttribute('data-height') || '600px',
      allowFullscreen: true,
      customStyles: {
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
      }
    };

    // Load the game
    const script = document.createElement('script');
    script.src = 'https://app.blindbarrels.com/embed.js';
    script.async = true;
    document.head.appendChild(script);

    // Optional: Track game completion
    window.addEventListener('blindbarrels:completed', function(event) {
      console.log('Game completed', event.detail.score);
    });
  })();
</script>
```

### Customization Options

Customize using data attributes on the container:

```html
<div 
  id="blindbarrels-game"
  data-theme="dark"           <!-- 'light' or 'dark' -->
  data-height="800px"         <!-- any valid CSS height -->
  data-fullscreen="false"     <!-- allow fullscreen mode -->
  data-border-radius="12px"   <!-- rounded corners -->
  data-shadow="none"         <!-- remove shadow -->
></div>
```

### Need Help?
Contact support@blindbarrels.com

## For Developers

### Local Development
```bash
# Clone the repository
git clone https://github.com/nuwud/whiskey-wiz-react.git
cd whiskey-wiz-react

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup
Create `.env.local` with:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
```

### Deployment
```bash
# Build for production
npm run build

# Test production build locally
npm run start

# Deploy to Firebase
firebase deploy
```

## License
Proprietary - All Rights Reserved © BlindBarrels.com
</content>
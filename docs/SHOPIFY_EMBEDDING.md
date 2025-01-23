# Embedding in Shopify

## Quick Start
Add this code to your Shopify page's custom HTML section:

```html
<!-- BlindBarrels Game Embed -->
<div id="blindbarrels-game" data-quarter="current"></div>
<script>
  (function() {
    window.blindbarrelsConfig = {
      // Current quarter will be auto-detected
      quarter: document.getElementById('blindbarrels-game').getAttribute('data-quarter'),
      theme: 'light',  // or 'dark'
      containerHeight: '600px'
    };

    var script = document.createElement('script');
    script.src = 'https://app.blindbarrels.com/embed.js';
    script.async = true;
    document.head.appendChild(script);
  })();
</script>
```

## Configuration Options

```javascript
window.blindbarrelsConfig = {
  // Required
  quarter: 'current', // or 'Q1-2025', 'Q2-2025', etc.
  
  // Optional
  theme: 'light',    // or 'dark'
  containerHeight: '600px',
  allowFullscreen: true,
  showNavigation: false,  // hide navigation in embedded mode
  customStyles: {
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  }
};
```

## Responsive Design
The game will automatically resize to fit the container width while maintaining aspect ratio.

## Events
Listen for game events:

```javascript
window.addEventListener('blindbarrels:loaded', function() {
  console.log('Game loaded');
});

window.addEventListener('blindbarrels:completed', function(event) {
  console.log('Game completed', event.detail.score);
});
```

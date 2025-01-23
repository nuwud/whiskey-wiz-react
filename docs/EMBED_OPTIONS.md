# BlindBarrels Game Embed Options

## Basic Embed

Minimal setup:
```html
<div id="blindbarrels-game"></div>
<script src="https://app.blindbarrels.com/embed.js"></script>
```

## Advanced Configuration

### Container Options

Set options using data attributes:
```html
<div 
  id="blindbarrels-game"
  data-theme="dark"
  data-height="800px"
  data-fullscreen="true"
  data-border-radius="12px"
  data-shadow="medium"
></div>
```

### Available Options

| Option | Values | Default | Description |
|--------|---------|---------|-------------|
| data-theme | `light`, `dark` | `light` | Color theme |
| data-height | Any CSS height | `600px` | Container height |
| data-fullscreen | `true`, `false` | `true` | Allow fullscreen mode |
| data-border-radius | Any CSS radius | `8px` | Corner rounding |
| data-shadow | `none`, `small`, `medium` | `medium` | Container shadow |

### JavaScript Configuration

Customize via `window.blindbarrelsConfig`:
```javascript
window.blindbarrelsConfig = {
  theme: 'dark',
  containerHeight: '800px',
  allowFullscreen: true,
  showNavigation: false,
  customStyles: {
    borderRadius: '12px',
    boxShadow: 'none',
    border: '1px solid #e2e8f0'
  }
};
```

### Events

Listen for game events:
```javascript
// Game loaded
window.addEventListener('blindbarrels:loaded', () => {
  console.log('Game ready');
});

// Game completed
window.addEventListener('blindbarrels:completed', (event) => {
  const { score, quarter } = event.detail;
  console.log(`Quarter ${quarter} completed with score ${score}`);
});

// Player authenticated
window.addEventListener('blindbarrels:auth', (event) => {
  const { isAuthenticated, userId } = event.detail;
});
```

### Styling

Custom CSS:
```css
/* Container styles */
.blindbarrels-container {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

/* Fullscreen mode */
.blindbarrels-fullscreen {
  border-radius: 0 !important;
}
```

### Troubleshooting

Common issues:

1. Game not loading
   - Check console for errors
   - Verify domain is whitelisted

2. Styling issues
   - Clear browser cache
   - Check CSS specificity

3. Events not firing
   - Verify event listener setup
   - Check event names

Contact support@blindbarrels.com for help.</content>
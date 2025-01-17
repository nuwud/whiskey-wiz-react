import { auth } from '@/lib/firebase';

interface ShopifyConfig {
  theme?: 'light' | 'dark';
  containerHeight?: string;
  allowFullscreen?: boolean;
  customStyles?: {
    borderRadius?: string;
    boxShadow?: string;
  };
}

interface GameCompletionData {
  score: number;
  quarterId: string;
  timestamp: Date;
  userId: string;
}

class ShopifyService {
  private static instance: ShopifyService;
  private scriptLoaded: boolean = false;
  private gameContainer: HTMLElement | null = null;
  private config: ShopifyConfig = {
    theme: 'light',
    containerHeight: '600px',
    allowFullscreen: true,
    customStyles: {
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
    }
  };

  private constructor() {}

  static getInstance(): ShopifyService {
    if (!ShopifyService.instance) {
      ShopifyService.instance = new ShopifyService();
    }
    return ShopifyService.instance;
  }

  // Initialization and Configuration
  initialize(config: Partial<ShopifyConfig> = {}): void {
    this.config = { ...this.config, ...config };
    this.injectGameScript();
    this.setupEventListeners();
  }

  private injectGameScript(): void {
    if (this.scriptLoaded) return;
    
    const script = document.createElement('script');
    script.src = process.env.NEXT_PUBLIC_GAME_SCRIPT_URL || 'https://app.blindbarrels.com/embed.js';
    script.async = true;
    document.head.appendChild(script);
    this.scriptLoaded = true;
  }

  private setupEventListeners(): void {
    window.addEventListener('blindbarrels:loaded', this.handleGameLoaded.bind(this));
    window.addEventListener('blindbarrels:completed', this.handleGameCompleted.bind(this));
    window.addEventListener('blindbarrels:error', this.handleGameError.bind(this));
  }

  // Container Management
  mountGame(containerId: string): void {
    this.gameContainer = document.getElementById(containerId);
    if (!this.gameContainer) {
      console.error(`Container with id '${containerId}' not found`);
      return;
    }

    this.applyContainerStyles();
    this.injectGameScript();
  }

  private applyContainerStyles(): void {
    if (!this.gameContainer) return;

    const { containerHeight, customStyles } = this.config;
    Object.assign(this.gameContainer.style, {
      height: containerHeight,
      width: '100%',
      ...customStyles
    });
  }

  // Event Handlers
  private async handleGameLoaded(event: Event): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      // Initialize game with user data
      await this.sendMessageToGame('initializeUser', {
        userId: user.uid,
        displayName: user.displayName,
        email: user.email
      });

    } catch (error) {
      console.error('Error handling game load:', error);
      this.handleGameError(new ErrorEvent('error', { error }));
    }
  }

  private async handleGameCompleted(event: CustomEvent<GameCompletionData>): Promise<void> {
    try {
      const { score, quarterId, timestamp } = event.detail;
      
      // Validate completion data
      if (!this.validateCompletionData(score, quarterId)) {
        throw new Error('Invalid completion data');
      }

      // Track completion in analytics
      await this.trackCompletion({
        score,
        quarterId,
        timestamp,
        userId: auth.currentUser?.uid || 'anonymous'
      });

    } catch (error) {
      console.error('Error handling game completion:', error);
      this.handleGameError(new ErrorEvent('error', { error }));
    }
  }

  private handleGameError(event: ErrorEvent): void {
    console.error('Game error:', event.error);
    // Implement error reporting logic
  }

  // Utility Methods
  private validateCompletionData(score: number, quarterId: string): boolean {
    return (
      typeof score === 'number' &&
      score >= 0 &&
      score <= 100 &&
      typeof quarterId === 'string' &&
      quarterId.trim().length > 0
    );
  }

  private async trackCompletion(data: GameCompletionData): Promise<void> {
    try {
      // Implement analytics tracking
      console.log('Tracking completion:', data);
    } catch (error) {
      console.error('Error tracking completion:', error);
    }
  }

  private async sendMessageToGame(type: string, payload: any): Promise<void> {
    if (!this.gameContainer) return;

    try {
      const iframe = this.gameContainer.querySelector('iframe');
      if (!iframe?.contentWindow) {
        throw new Error('Game iframe not found');
      }

      iframe.contentWindow.postMessage({
        type,
        payload
      }, '*');

    } catch (error) {
      console.error('Error sending message to game:', error);
    }
  }

  // API Interface
  getConfig(): ShopifyConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<ShopifyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.applyContainerStyles();
  }

  destroy(): void {
    window.removeEventListener('blindbarrels:loaded', this.handleGameLoaded);
    window.removeEventListener('blindbarrels:completed', this.handleGameCompleted);
    window.removeEventListener('blindbarrels:error', this.handleGameError);
    this.gameContainer = null;
    this.scriptLoaded = false;
  }
}

export const shopifyService = ShopifyService.getInstance();

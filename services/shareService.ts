
import type { ShareData, IShareStrategy } from '../types';

/**
 * Strategy 1: Native Web Share API
 * Best for mobile devices (iOS/Android)
 */
class WebShareStrategy implements IShareStrategy {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.share;
  }

  async share(data: ShareData): Promise<void> {
    try {
      await navigator.share(data);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        throw error;
      }
    }
  }
}

/**
 * Strategy 2: Clipboard Fallback
 * Best for desktop browsers where navigator.share might not be supported or limited
 */
class ClipboardStrategy implements IShareStrategy {
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && !!navigator.clipboard;
  }

  async share(data: ShareData): Promise<void> {
    // Combine fields into a single string for clipboard
    const parts = [data.title, data.text];
    if (data.url) parts.push(data.url);
    
    const combinedText = parts.filter(Boolean).join('\n\n');
    await navigator.clipboard.writeText(combinedText);
  }
}

/**
 * ShareService Context
 * Selects the best available strategy at runtime.
 */
export class ShareService {
  private strategy: IShareStrategy;

  constructor() {
    // Priority: Web Share -> Clipboard
    const webShare = new WebShareStrategy();
    if (webShare.isSupported()) {
      this.strategy = webShare;
    } else {
      this.strategy = new ClipboardStrategy();
    }
  }

  async share(data: ShareData): Promise<{ success: boolean; method: 'native' | 'clipboard' }> {
    try {
      await this.strategy.share(data);
      return { 
        success: true, 
        method: this.strategy instanceof WebShareStrategy ? 'native' : 'clipboard' 
      };
    } catch (error) {
      console.error('Sharing failed:', error);
      return { success: false, method: 'native' };
    }
  }
}

// Singleton instance
export const shareService = new ShareService();

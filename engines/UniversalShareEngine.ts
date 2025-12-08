
import type { ISharingEngine } from '../core/interfaces';
import type { ShareData } from '../types';

export class UniversalShareEngine implements ISharingEngine {
  async share(data: ShareData): Promise<{ success: boolean; method: string }> {
    // Strategy 1: Native Share
    if (navigator.share) {
      try {
        await navigator.share(data);
        return { success: true, method: 'native' };
      } catch (e) {
        if ((e as any).name !== 'AbortError') console.error(e);
      }
    }
    
    // Strategy 2: Clipboard
    try {
      const parts = [data.title, data.text, data.url].filter(Boolean);
      await navigator.clipboard.writeText(parts.join('\n\n'));
      return { success: true, method: 'clipboard' };
    } catch (e) {
      console.error(e);
      return { success: false, method: 'none' };
    }
  }
}

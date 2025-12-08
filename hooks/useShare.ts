
import { useCallback } from 'react';
import { shareService } from '../services/shareService';
import type { ShareData } from '../types';

interface UseShareResult {
  share: (data: ShareData) => Promise<void>;
}

export const useShare = (onSuccess?: (msg: string) => void): UseShareResult => {
  const share = useCallback(async (data: ShareData) => {
    const result = await shareService.share(data);
    
    if (result.success && onSuccess) {
      if (result.method === 'clipboard') {
        onSuccess('Copied to clipboard!');
      } else {
        // Native share usually gives its own feedback, but we can still toast if needed
        // onSuccess('Shared successfully');
      }
    }
  }, [onSuccess]);

  return { share };
};

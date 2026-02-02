import { useEffect } from 'react';

/**
 * Hook global para minimizar o teclado virtual:
 * - Ao pressionar Enter em campos de input (após executar a ação)
 * - Ao tocar fora do campo de input (tap outside)
 */
export function useDismissKeyboardOnEnter() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        
        // Only blur if it's an input (not multiline textarea that needs Enter)
        if (target.tagName === 'INPUT') {
          // Use setTimeout to allow any onKeyDown/onChange handlers to execute first
          // This ensures search/form actions complete before dismissing keyboard
          setTimeout(() => {
            target.blur();
          }, 10);
        }
        
        // For textarea, only blur if it's a single-line textarea or if Shift isn't pressed
        if (target.tagName === 'TEXTAREA' && !e.shiftKey) {
          const textarea = target as HTMLTextAreaElement;
          // Check if it's configured as single-line (by checking rows attribute)
          if (textarea.rows === 1) {
            setTimeout(() => {
              target.blur();
            }, 10);
          }
        }
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      const activeElement = document.activeElement as HTMLElement;
      
      // If there's a focused input/textarea and the tap is outside of it
      if (
        activeElement &&
        (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA') &&
        !activeElement.contains(target) &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.closest('input') &&
        !target.closest('textarea')
      ) {
        activeElement.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);
}

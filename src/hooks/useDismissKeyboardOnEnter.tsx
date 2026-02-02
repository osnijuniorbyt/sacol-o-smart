import { useEffect } from 'react';

/**
 * Hook global para minimizar o teclado virtual ao pressionar Enter
 * em campos de input/textarea em dispositivos móveis
 */
export function useDismissKeyboardOnEnter() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const target = e.target as HTMLElement;
        
        // Only blur if it's an input or textarea (not multiline textarea that needs Enter)
        if (target.tagName === 'INPUT') {
          target.blur();
        }
        
        // For textarea, only blur if it's a single-line textarea or if Shift isn't pressed
        if (target.tagName === 'TEXTAREA' && !e.shiftKey) {
          const textarea = target as HTMLTextAreaElement;
          // Check if it's configured as single-line (by checking rows attribute)
          if (textarea.rows === 1) {
            target.blur();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

import { useRef, useEffect, useCallback } from 'react';

interface FocusTrapProps {
  enabled?: boolean;
  children: React.ReactNode;
}

export function FocusTrap({ enabled = true, children }: FocusTrapProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const refocus = useCallback(() => {
    if (enabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      // Initial focus
      refocus();
      
      // Refocus on any click outside
      const handleClick = () => {
        // Small delay to let click complete
        setTimeout(refocus, 10);
      };
      
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [enabled, refocus]);

  return (
    <div className="relative">
      {/* Invisible input that captures all keyboard input */}
      <input
        ref={inputRef}
        type="text"
        autoFocus={enabled}
        onBlur={refocus}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        aria-hidden="true"
        tabIndex={-1}
      />
      {children}
    </div>
  );
}

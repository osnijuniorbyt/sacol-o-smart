import { useEffect, useRef, useCallback } from 'react';

interface UseBarcodeScanner {
  onScan?: (barcode: string) => void;
  enabled?: boolean;
}

// Keyboard Wedge detection with speed-based differentiation
// Scanner: < 30ms between keystrokes
// Human: > 50ms between keystrokes

export function useBarcodeScanner({ onScan, enabled = true }: UseBarcodeScanner = {}) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const clearBuffer = useCallback(() => {
    bufferRef.current = '';
  }, []);

  const emitBarcodeEvent = useCallback((barcode: string) => {
    const event = new CustomEvent('barcode-scanned', {
      detail: { barcode },
      bubbles: true,
    });
    window.dispatchEvent(event);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const timeSinceLastKey = now - lastKeyTimeRef.current;

      // Enter key - check if we have a valid barcode in buffer
      if (e.key === 'Enter') {
        if (bufferRef.current.length > 3) {
          const barcode = bufferRef.current;
          
          // Call the callback
          onScan?.(barcode);
          
          // Emit custom event for other components
          emitBarcodeEvent(barcode);
        }
        clearBuffer();
        lastKeyTimeRef.current = 0;
        return;
      }

      // Only process printable characters
      if (e.key.length !== 1) return;

      // Speed detection logic
      if (lastKeyTimeRef.current > 0) {
        if (timeSinceLastKey > 50) {
          // Human typing - clear buffer and start fresh
          clearBuffer();
        }
        // If < 30ms, it's definitely a scanner - keep adding to buffer
        // If between 30-50ms, we're uncertain but keep the buffer (benefit of doubt)
      }

      // Add character to buffer
      bufferRef.current += e.key;
      lastKeyTimeRef.current = now;
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onScan, clearBuffer, emitBarcodeEvent]);

  return {
    clearBuffer,
  };
}

// Hook to listen for barcode-scanned events in any component
export function useBarcodeEvent(callback: (barcode: string) => void) {
  useEffect(() => {
    const handleBarcodeScanned = (e: CustomEvent<{ barcode: string }>) => {
      callback(e.detail.barcode);
    };

    window.addEventListener('barcode-scanned', handleBarcodeScanned as EventListener);

    return () => {
      window.removeEventListener('barcode-scanned', handleBarcodeScanned as EventListener);
    };
  }, [callback]);
}

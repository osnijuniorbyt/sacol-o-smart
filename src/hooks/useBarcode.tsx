import { useState, useCallback, useEffect } from 'react';
import { BarcodeData } from '@/types/database';

// EAN-13 structure for scale: 2PPPPP WWWWW C
// 2 = prefix for weighed items
// PPPPP = PLU (5 digits)
// WWWWW = Weight in grams (5 digits)
// C = Check digit

export function useBarcode() {
  const [lastBarcode, setLastBarcode] = useState<string>('');
  const [barcodeBuffer, setBarcodeBuffer] = useState<string>('');

  const parseEAN13 = useCallback((barcode: string): BarcodeData | null => {
    // Clean the barcode
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    // Must be 13 digits
    if (cleanBarcode.length !== 13) {
      return null;
    }

    // Check if it's a weighed item (starts with 2)
    if (cleanBarcode[0] !== '2') {
      return null;
    }

    // Extract PLU (positions 1-5, 5 digits)
    const plu = cleanBarcode.substring(1, 6);
    
    // Extract weight in grams (positions 6-10, 5 digits)
    const weightGrams = parseInt(cleanBarcode.substring(6, 11), 10);
    
    // Convert to kg
    const weight = weightGrams / 1000;

    return {
      plu,
      weight
    };
  }, []);

  const validateEAN13 = useCallback((barcode: string): boolean => {
    const cleanBarcode = barcode.replace(/\D/g, '');
    
    if (cleanBarcode.length !== 13) {
      return false;
    }

    // Calculate check digit
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(cleanBarcode[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(cleanBarcode[12], 10);
  }, []);

  // Handle keyboard input from barcode scanner
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear buffer after 100ms of no input (scanner finishes)
      clearTimeout(timeout);
      
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 13) {
          setLastBarcode(barcodeBuffer);
        }
        setBarcodeBuffer('');
        return;
      }

      // Only add numeric characters
      if (/^\d$/.test(e.key)) {
        setBarcodeBuffer(prev => prev + e.key);
      }

      timeout = setTimeout(() => {
        if (barcodeBuffer.length >= 13) {
          setLastBarcode(barcodeBuffer);
        }
        setBarcodeBuffer('');
      }, 100);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timeout);
    };
  }, [barcodeBuffer]);

  const clearLastBarcode = useCallback(() => {
    setLastBarcode('');
  }, []);

  const manualBarcode = useCallback((barcode: string) => {
    setLastBarcode(barcode);
  }, []);

  return {
    lastBarcode,
    parseEAN13,
    validateEAN13,
    clearLastBarcode,
    manualBarcode
  };
}

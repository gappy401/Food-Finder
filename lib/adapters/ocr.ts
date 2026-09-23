import type { PantryCategory } from '../types';

export interface ReceiptLineItem {
  name: string;
  quantity?: string;
  category: PantryCategory;
}

/**
 * Anything that can turn a photo of a grocery receipt into pantry line
 * items. Swap `MockOCRProvider` for a real implementation (Google Cloud
 * Vision OCR + a parsing pass, or a Claude vision call against the photo)
 * once you're ready to wire up receipt scanning for real.
 */
export interface OCRProvider {
  scanReceipt(imageUri: string): Promise<ReceiptLineItem[]>;
}

const SAMPLE_RECEIPTS: ReceiptLineItem[][] = [
  [
    { name: 'Chicken breast', quantity: '1.2 lb', category: 'protein' },
    { name: 'Broccoli', quantity: '1 head', category: 'produce' },
    { name: 'Greek yogurt', quantity: '32 oz', category: 'dairy' },
    { name: 'Brown rice', quantity: '2 lb', category: 'grain' },
    { name: 'Garlic', quantity: '1 bulb', category: 'produce' },
  ],
  [
    { name: 'Eggs', quantity: '1 dozen', category: 'protein' },
    { name: 'Spinach', quantity: '5 oz bag', category: 'produce' },
    { name: 'Feta cheese', quantity: '8 oz', category: 'dairy' },
    { name: 'Cherry tomatoes', quantity: '1 pint', category: 'produce' },
    { name: 'Whole wheat pasta', quantity: '1 lb', category: 'grain' },
  ],
  [
    { name: 'Salmon fillets', quantity: '1 lb', category: 'protein' },
    { name: 'Lemon', quantity: '3', category: 'produce' },
    { name: 'Asparagus', quantity: '1 bunch', category: 'produce' },
    { name: 'Olive oil', quantity: '', category: 'condiment' },
  ],
];

/**
 * Simulates the latency and output shape of a real OCR call. Picks a
 * pseudo-random sample receipt so repeated scans in a demo look varied.
 */
export class MockOCRProvider implements OCRProvider {
  async scanReceipt(imageUri: string): Promise<ReceiptLineItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const index = Math.abs(hashString(imageUri)) % SAMPLE_RECEIPTS.length;
    return SAMPLE_RECEIPTS[index];
  }
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

// TODO(real integration): implement a GoogleVisionOCRProvider or
// ClaudeVisionOCRProvider (send the receipt photo to Claude with a
// "list the grocery line items as JSON" prompt) and swap it in here.
export const ocrProvider: OCRProvider = new MockOCRProvider();

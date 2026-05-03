const SKIP_WORDS = [
    'subtotal', 'sub-total', 'total', 'amount due', 'balance due', 'change due',
    'cash', 'credit', 'debit', 'visa', 'mastercard', 'amex', 'discover',
    'payment', 'received', 'thank', 'server', 'table', 'check#', 'guest',
    'party', 'phone', 'address', 'fax', 'www', 'http', 'order#', 'transaction',
    'receipt', 'void', 'refund', 'balance', 'tendered', 'approved', 'contactless',
    'ref:', 'status', 'type:', 'entry:', 'time:', 'invalid',
];
// Common OCR misreads included: 'tak' for 'tax', 'lax' for 'tax'
const TAX_WORDS = ['tax', 'sales tax', 'hst', 'gst', 'pst', 'tak', 'lax'];
const TIP_WORDS = ['tip', 'tips', 'gratuity', 'grat', 'service charge', 'srvce chg'];

function parseBillText(text) {
    const today = new Date().toISOString().split('T')[0];
    let receipt_date = today;
    let Tax = 0.0;
    let tip = 0.0;
    const receipt_items = [];

    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    for (const line of lines) {
        // Date extraction — handle both YYYY-MM-DD and DD/MM/YYYY or MM/DD/YYYY
        const dateMatch = line.match(/\b(\d{4}-\d{2}-\d{2})\b|\b(\d{2}\/\d{2}\/\d{4})\b/);
        if (dateMatch && receipt_date === today) {
            if (dateMatch[2]) {
                const [a, b, y] = dateMatch[2].split('/');
                // If first part > 12 it must be a day, so format is DD/MM/YYYY
                const [m, d] = parseInt(a) > 12 ? [b, a] : [a, b];
                receipt_date = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
                receipt_date = dateMatch[1];
            }
        }

        // Find all XX.XX prices in the line — no $ required because OCR often drops it.
        // Require at least one digit before the decimal to avoid matching ".50" fragments.
        const allPrices = [...line.matchAll(/\$?\s*(\d{1,4}\.\d{2})/g)];
        if (allPrices.length === 0) continue;

        // Use the last (rightmost) price — on a receipt that's the line total, not unit price.
        const lastPrice = allPrices[allPrices.length - 1];
        const price = parseFloat(lastPrice[1]);

        // Name = everything before the price, stripped of leading OCR border noise.
        const namePart = line
            .slice(0, lastPrice.index)
            .replace(/^[^a-zA-Z0-9]+/, '')            // strip leading punctuation/symbols
            .replace(/[^a-zA-Z0-9\s&'\-()/]+/g, ' ')  // replace remaining noise with space
            .replace(/\s+/g, ' ')
            .trim();

        // Skip lines where the "name" is too short to be a real item (OCR border noise).
        if (namePart.length < 3) continue;

        const lower = line.toLowerCase();

        if (TAX_WORDS.some(kw => lower.includes(kw))) { Tax = price; continue; }
        if (TIP_WORDS.some(kw => lower.includes(kw))) { tip = price; continue; }
        if (SKIP_WORDS.some(kw => lower.includes(kw))) continue;

        receipt_items.push({ item_name: namePart, item_cost: price });
    }

    return { receipt_date, receipt_items, Tax, tip };
}

export { parseBillText };

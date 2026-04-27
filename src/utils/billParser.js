import MlkitOcr from 'rn-mlkit-ocr';

async function parseBill(imgList) {
    let rawText = "";

    for (const img of imgList) {
        console.log(`Processing image uri: ${img.uri}`);
        try {
        const text = await MlkitOcr.recognizeText(img.uri, 'latin');
            rawText += text + "\n\n";
        } catch (error) {
            console.error(`Failed to scan image ${img.uri}:`, error);
        }
    }

    console.log("Raw Text Extracted:\n", rawText);
    const receiptData = extractReceiptData(rawText);
    return receiptData;
}

// Helper function to turn raw text into structured JSON (the hard part)
function extractReceiptData(rawText) {
    //This is the hard part where we need to actually process the text. Will do late -G.O
    const parsedData = {
        receipt_date: "2026-02-26",
        receipt_items: [
            {
                item_name: "hot dog",
                item_cost: 14.99,
            },
            {
                item_name: "water",
                item_cost: 2.99,
            },
            {
                item_name: "hot dog",
                item_cost: 14.99,
            },
            {
                item_name: "burger",
                item_cost: 23.99,
            }
        ],
        Tax: 0.0,
        tip: 0.0
    }

    return parsedData;
}

export { parseBill };
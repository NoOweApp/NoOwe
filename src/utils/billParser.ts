import type { OcrElement, OcrResult } from "rn-mlkit-ocr";
import MlkitOcr from "rn-mlkit-ocr";

async function parseBill(imgList: any) {
  let rawText = "";

  for (const img of imgList) {
    console.log(`Processing image uri: ${img.uri}`);
    try {
      const result = await MlkitOcr.recognizeText(img.uri, "latin");
      rawText += tabularizeData(result) + "\n\n";
    } catch (error) {
      console.error(`Failed to scan image ${img.uri}:`, error);
    }
  }

  console.log("Raw Text Extracted:\n", rawText);
  return extractReceiptData(rawText);
}

function getSkewAngle(elements: OcrElement[]): number {
  const angles: number[] = [];

  for (let i = 0; i < elements.length - 1; i++) {
    const a = elements[i];
    const b = elements[i + 1];
    const dy =
      b.frame.y + b.frame.height / 2 - (a.frame.y + a.frame.height / 2);
    const dx = b.frame.x + b.frame.width / 2 - (a.frame.x + a.frame.width / 2);
    if (Math.abs(dx) > 20) {
      angles.push(Math.atan2(dy, dx) * (180 / Math.PI));
    }
  }

  if (angles.length === 0) return 0;
  angles.sort((a, b) => a - b);
  return angles[Math.floor(angles.length / 2)];
}

function tabularizeData(resultObject: OcrResult) {
  let result = "";

  let textElements: OcrElement[] = [];
  for (let i = 0; i < resultObject.blocks.length; i++) {
    let lines = resultObject.blocks[i].lines;
    for (let j = 0; j < lines.length; j++) {
      let elements = lines[j].elements;
      for (let k = 0; k < elements.length; k++) {
        textElements.push(elements[k]);
      }
    }
  }

  const skewAngle = getSkewAngle(textElements);
  const skewRad = skewAngle * (Math.PI / 180);

  textElements.sort(compareElements);

  for (let i = 0; i < textElements.length - 1; i++) {
    result += textElements[i].text + " ";
    if (!isSameLine(textElements[i], textElements[i + 1], skewRad)) {
      result += "\n";
    }
  }
  result += textElements[textElements.length - 1].text;

  return result;
}

function compareElements(t1: OcrElement, t2: OcrElement) {
  let diffOfTops =
    t1.frame.y + t1.frame.height - (t2.frame.y + t2.frame.height);
  let diffOfLefts = t1.frame.x - t2.frame.x;

  let height = (t1.frame.height + t2.frame.height) / 2;
  let verticalDiff = height * 0.35;

  let result = diffOfLefts;
  if (Math.abs(diffOfTops) > verticalDiff) {
    result = diffOfTops;
  }
  return result;
}

function isSameLine(t1: OcrElement, t2: OcrElement, skewRad: number = 0) {
  const cx1 = t1.frame.x + t1.frame.width / 2;
  const cy1 = t1.frame.y + t1.frame.height / 2;
  const cx2 = t2.frame.x + t2.frame.width / 2;
  const cy2 = t2.frame.y + t2.frame.height / 2;

  const correctedY1 = cy1 * Math.cos(skewRad) - cx1 * Math.sin(skewRad);
  const correctedY2 = cy2 * Math.cos(skewRad) - cx2 * Math.sin(skewRad);

  const avgHeight = (t1.frame.height + t2.frame.height) / 2;
  return Math.abs(correctedY1 - correctedY2) < avgHeight * 0.5;
}

// Helper function to turn raw text into structured JSON (the hard part)
function extractReceiptData(rawText: string) {
  /*
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
      },
    ],
    Tax: 0.0,
    tip: 0.0,
  };
  */
  // Sanitize: collapse spaces around decimal separators e.g. "14, 77" → "14,77"
  const sanitized = rawText.replace(/(\d+[.,])\s+(\d{1,2})/g, "$1$2");

  const regex = /^(.{3,}?)\s+\$?(\d+[.,]\d{0,2})/gm;

  const SUMMARY_KEYS = [
    "subtotal",
    "sub total",
    "sub-total",
    "total",
    "tax",
    "vat",
    "tip",
    "gratuity",
    "service charge",
    "servs charge",
    "serv charge",
    "admin fee",
    "food",
    "beverage",
    "wine",
    "net",
    "balance",
    "amount due",
    "cash",
    "change",
    "payment",
    "discount",
    "pre-discount",
    "credit card"
  ];

  const isSummaryLine = (name: string) =>
    SUMMARY_KEYS.some((k) => name.toLowerCase().trim().startsWith(k));

  const extractSummaryValue = (keys: string[]): number => {
    for (const key of keys) {
      const match = sanitized.match(
        new RegExp(`^(${key}.{0,20}?)\\s+\\$?(\\d+[.,]\\d{0,2})`, "im"),
      );
      if (match) return parseFloat(match[2].replace(",", "."));
    }
    return 0.0;
  };

  const receipt_items: { item_name: string; item_cost: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(sanitized)) !== null) {
    const rawName = match[1].trim();
    const rawPrice = match[2];

    if (isSummaryLine(rawName)) {
      if (rawName.toLowerCase().trim().startsWith("total")) {
        break;
      }
      continue;
    }

    // Filter out lines that are likely OCR noise:
    // - Purely numeric names
    // - Very short after trimming quantity prefix
    // - Lines with only symbols/punctuation
    const nameWithoutQty = rawName.replace(/^\d+\s+/, "").trim();
    if (/^\d+$/.test(nameWithoutQty)) continue;
    if (nameWithoutQty.length < 3) continue;
    if (/^[^a-zA-Z]+$/.test(nameWithoutQty)) continue;

    const item_cost = parseFloat(rawPrice.replace(",", "."));

    // Ignore implausible prices (e.g. OCR misread years/phone numbers as prices)
    if (item_cost <= 0 || item_cost >= 1000) continue;

    receipt_items.push({
      item_name: nameWithoutQty,
      item_cost,
    });
  }

  const tax = extractSummaryValue(["tax", "vat", "taxes"]);
  const tip = extractSummaryValue([
    "tip",
    "gratuity",
    "servs charge",
    "serv charge",
    "service charge",
  ]);

  // Attempt to extract date in common formats: MM/DD/YY, DD/MM/YY, DD Mon YY
  const dateMatch = sanitized.match(
    /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b|\b(\d{1,2})(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)['\s]?(\d{2,4})\b/i,
  );
  const receipt_date = dateMatch ? dateMatch[0] : "unknown";

  const bill = {
    receipt_date,
    receipt_items,
    tax,
    tip,
  };

  console.log("Extract Reciept Data Output: ", bill, "\n");

  return bill;
}

export { parseBill };

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
      },
    ],
    Tax: 0.0,
    tip: 0.0,
  };

  return parsedData;
}

export { parseBill };

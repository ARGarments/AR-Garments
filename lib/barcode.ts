/**
 * Generates an SVG string representation of a Code 128 barcode (subset B).
 * Used for thermal printer compatibility without heavy npm packages.
 */

// Code 128 patterns (index = character code)
const CODE128_PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export function generateBarcodeSvg(
  text: string,
  options?: {
    height?: number;
    moduleWidth?: number;
    showText?: boolean;
  }
): string {
  const height = options?.height ?? 50;
  const moduleWidth = options?.moduleWidth ?? 1.8;
  const showText = options?.showText ?? true;

  const cleanText = text.trim();
  if (!cleanText) return '';

  const codes: number[] = [START_CODE_B];
  let checkSum = START_CODE_B;

  for (let i = 0; i < cleanText.length; i++) {
    const charCode = cleanText.charCodeAt(i) - 32;
    const validCode = charCode >= 0 && charCode <= 95 ? charCode : 0;
    codes.push(validCode);
    checkSum += validCode * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP_CODE);

  let barString = "";
  for (const c of codes) {
    barString += CODE128_PATTERNS[c] || "212222";
  }

  // Render bars
  const rects: string[] = [];
  let currentX = 10; // margin

  for (let i = 0; i < barString.length; i++) {
    const width = parseInt(barString[i], 10) * moduleWidth;
    const isBar = i % 2 === 0;
    if (isBar) {
      rects.push(`<rect x="${currentX.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${height}" fill="#000000"/>`);
    }
    currentX += width;
  }

  const totalWidth = currentX + 10;
  const totalHeight = showText ? height + 16 : height;

  const textSvg = showText
    ? `<text x="${(totalWidth / 2).toFixed(1)}" y="${height + 12}" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#000000" letter-spacing="1.5">${cleanText}</text>`
    : '';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${totalHeight}" width="100%" height="auto" style="max-width: ${totalWidth}px; display: block; margin: 0 auto;">
      ${rects.join('')}
      ${textSvg}
    </svg>
  `.trim();
}

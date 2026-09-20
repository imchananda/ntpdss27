/**
 * Robust CSV Parsing Utilities for Google Sheets Export
 */

export interface ParsedCSVRow {
  [key: string]: string;
}

/**
 * Parses raw CSV text string into array of rows with header keys.
 * Correctly handles quoted strings containing commas and newlines.
 */
export function parseCSV(csvText: string): ParsedCSVRow[] {
  if (!csvText || !csvText.trim()) return [];

  // Remove BOM header if present
  const cleanCsv = csvText.replace(/^\uFEFF/, '').trim();
  const rows = parseCSVToRows(cleanCsv);

  if (rows.length < 2) return [];

  // First row is header
  const headers = rows[0].map(h => h.toLowerCase().trim().replace(/^"|"$/g, ''));
  const results: ParsedCSVRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const rowObj: ParsedCSVRow = {};
    headers.forEach((header, index) => {
      if (header) {
        rowObj[header] = (row[index] || '').trim().replace(/^"|"$/g, '');
      }
    });

    results.push(rowObj);
  }

  return results;
}

/**
 * Splits raw CSV text into 2D array of rows and columns, respecting quoted strings.
 */
function parseCSVToRows(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside string ("")
        cell += '"';
        i++;
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Cell delimiter
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      // Line break
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      row.push(cell);
      cell = '';
      if (row.some(c => c.length > 0)) {
        result.push(row);
      }
      row = [];
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    result.push(row);
  }

  return result;
}

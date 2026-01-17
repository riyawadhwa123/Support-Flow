/**
 * Simple CSV parser that works in the browser without external dependencies
 */

export interface ParsedRow {
  [key: string]: string | number;
}

/**
 * Parse CSV text into an array of objects
 */
export function parseCSV(csvText: string): ParsedRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length === 0) {
    return [];
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const results: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;
    
    const row: ParsedRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    results.push(row);
  }
  
  return results;
}

/**
 * Parse a single CSV line, handling quotes and commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current.trim());
  
  return result;
}

/**
 * Convert CSV file to JSON
 */
export async function csvFileToJSON(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = parseCSV(text);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}


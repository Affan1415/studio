import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractSheetIdFromUrl(url: string): string | null {
  if (!url) return null;
  const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
}

// Helper to format sheet data for prompt (example)
export function formatSheetDataForPrompt(data: any[][]): string {
  if (!data || data.length === 0) return "No data available.";
  
  const headers = data[0];
  const rows = data.slice(1);

  let tableString = `| ${headers.join(" | ")} |\n`;
  tableString += `| ${headers.map(() => "---").join(" | ")} |\n`;
  
  rows.forEach(row => {
    tableString += `| ${row.join(" | ")} |\n`;
  });
  
  return tableString;
}

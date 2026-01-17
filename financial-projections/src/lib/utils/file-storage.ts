import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'csv-uploads');

/**
 * Ensure the upload directory exists
 */
async function ensureUploadDir(): Promise<void> {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Save an uploaded CSV file to disk
 * @param file The uploaded File object
 * @returns The file path where the file was saved
 */
export async function saveCsvFile(file: File): Promise<string> {
  await ensureUploadDir();

  // Generate unique filename
  const timestamp = Date.now();
  const randomId = uuidv4();
  const extension = path.extname(file.name) || '.csv';
  const safeFilename = `${timestamp}_${randomId}${extension}`;
  const filePath = path.join(UPLOAD_DIR, safeFilename);

  // Read file content
  const fileBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(fileBuffer);

  // Write to disk
  await fs.writeFile(filePath, buffer);

  return filePath;
}

/**
 * Read a CSV file from disk
 * @param filePath The path to the CSV file
 * @returns The file content as a string
 */
export async function readCsvFile(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  return content;
}

/**
 * Delete a CSV file from disk
 * @param filePath The path to the CSV file
 */
export async function deleteCsvFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    // Don't throw - file deletion is not critical
  }
}

/**
 * Check if a file exists
 * @param filePath The path to check
 * @returns true if file exists, false otherwise
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the upload directory path
 */
export function getUploadDir(): string {
  return UPLOAD_DIR;
}

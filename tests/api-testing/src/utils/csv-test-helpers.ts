import * as fs from 'fs';
import * as path from 'path';

const FIXTURES_DIR = path.resolve(__dirname, '../fixtures/csv');

/**
 * Load a CSV fixture file content as a string
 */
export function loadCsvFixture(filename: string): string {
  const filePath = path.join(FIXTURES_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Create a File-like Blob from a CSV fixture for use in FormData
 * In Node.js, we use Blob which is available in Node 18+
 */
export function createCsvFileFromFixture(filename: string): Blob {
  const content = loadCsvFixture(filename);
  return new Blob([content], { type: 'text/csv' });
}

/**
 * Build a FormData with a CSV file from a fixture, ready for upload
 * Optionally includes a dataFormatId
 */
export function buildCsvUploadFormData(
  fixtureFilename: string,
  dataFormatId?: string
): FormData {
  const formData = new FormData();
  const blob = createCsvFileFromFixture(fixtureFilename);
  formData.append('file', blob, fixtureFilename);
  if (dataFormatId) {
    formData.append('dataFormatId', dataFormatId);
  }
  return formData;
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  // Update the path to match where csvFileInfo.json is saved
  const fileInfoPath = path.join(process.cwd(), 'public', 'csv', 'csvFileInfo.json');

  try {
    const data = fs.readFileSync(fileInfoPath, 'utf-8');
    const fileInfo = JSON.parse(data);

    const csvFilePath = fileInfo.filepath;

    // Read the CSV file content
    const csvContent = fs.readFileSync(csvFilePath);

    // Set headers for file download
    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    headers.append('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error downloading CSV file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

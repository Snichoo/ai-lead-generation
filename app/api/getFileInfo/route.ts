import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const fileInfoPath = path.join(process.cwd(), 'public', 'csv', 'csvFileInfo.json');

  try {
    const data = fs.readFileSync(fileInfoPath, 'utf-8');
    const fileInfo = JSON.parse(data);
    return NextResponse.json(fileInfo);
  } catch (error) {
    console.error('Error reading file info:', error);
    return NextResponse.json({ error: 'File info not found' }, { status: 404 });
  }
}
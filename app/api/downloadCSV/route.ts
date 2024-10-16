import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  try {
    const response = await fetch(`${API_URL}/download?filename=${encodeURIComponent(filename)}`);

    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const csvContent = await response.text();

    const headers = new Headers();
    headers.append('Content-Type', 'text/csv');
    headers.append('Content-Disposition', `attachment; filename="${filename}"`);

    return new NextResponse(csvContent, { headers });
  } catch (error) {
    console.error('Error downloading CSV file:', error);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

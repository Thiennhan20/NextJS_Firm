import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Đọc file version.json từ public folder
    const versionPath = path.join(process.cwd(), 'public', 'version.json');
    const versionData = fs.readFileSync(versionPath, 'utf8');
    const version = JSON.parse(versionData);
    
    return new NextResponse(version.version, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error reading version file:', error);
    
    // Fallback nếu không đọc được file
    return new NextResponse('1.0.9', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  }
}

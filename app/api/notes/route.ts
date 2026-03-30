import { NextResponse } from 'next/server';

// Stub handlers — all storage is client-side in MVP.
// These establish the URL contract for future backend wiring.

export async function GET() {
  return NextResponse.json(
    { error: 'Backend not configured. This app uses client-side storage by default.' },
    { status: 501 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: 'Backend not configured. This app uses client-side storage by default.' },
    { status: 501 }
  );
}

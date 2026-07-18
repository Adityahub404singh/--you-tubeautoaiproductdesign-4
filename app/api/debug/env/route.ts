import { NextResponse } from "next/server";
export async function GET() {
  const keys = ['GOOGLE_CLIENT_ID', 'NEXTAUTH_URL', 'DATABASE_URL', 'TURSO_AUTH_TOKEN', 'NEXTAUTH_SECRET'];
  const debug = keys.reduce((acc, key) => {
    const val = process.env[key];
    acc[key] = val ? `${val.slice(0, 5)}... (length: ${val.length})` : "MISSING";
    return acc;
  }, {} as any);
  return NextResponse.json(debug);
}

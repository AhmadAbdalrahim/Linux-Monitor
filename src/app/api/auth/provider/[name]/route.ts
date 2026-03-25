import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/auth/provider/${name}/callback`;

  if (name === "google") {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: "Google SSO not configured" }, { status: 500 });
    
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email profile`;
    return NextResponse.redirect(url);
  }

  if (name === "microsoft") {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: "Microsoft SSO not configured" }, { status: 500 });
    
    // Using common endpoint for personal Microsoft accounts, Xbox, and organizational accounts
    const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=User.Read email offline_access openid profile`;
    return NextResponse.redirect(url);
  }

  return NextResponse.json({ error: "Provider not supported" }, { status: 400 });
}

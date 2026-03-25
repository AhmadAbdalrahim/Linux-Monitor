import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectUri = `${baseUrl}/api/auth/provider/${name}/callback`;

  if (error) {
    return NextResponse.redirect(`${baseUrl}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=No+authorization+code`);
  }

  try {
    let email = "";
    let providerId = "";
    let userName = "";

    // -- GOOGLE --
    if (name === "google") {
      const clientId = process.env.GOOGLE_CLIENT_ID!;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Failed to get Google access token");

      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      email = userData.email;
      providerId = userData.id;
      userName = userData.name;
    } 
    
    // -- MICROSOFT --
    else if (name === "microsoft") {
      const clientId = process.env.MICROSOFT_CLIENT_ID!;
      const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;

      const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenData.access_token) throw new Error("Failed to get MS access token");

      const userRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = await userRes.json();
      email = userData.userPrincipalName || userData.mail; // Microsoft Graph returns email here usually
      providerId = userData.id;
      userName = userData.displayName;
    } else {
      throw new Error("Invalid provider");
    }

    if (!email) throw new Error("Could not retrieve email from provider");

    // Match or Create User
    let user = await (prisma as any).user.findUnique({ where: { email } });
    
    if (!user) {
      const userCount = await (prisma as any).user.count();
      user = await (prisma as any).user.create({
        data: {
          email,
          name: userName,
          isAdmin: userCount === 0, // First user is admin
        },
      });
    }

    // Link OAuth Account
    const existingAccount = await (prisma as any).oAuthAccount.findUnique({
      where: { provider_providerId: { provider: name, providerId } },
    });

    if (!existingAccount) {
      await (prisma as any).oAuthAccount.create({
        data: {
          provider: name,
          providerId,
          userId: user.id,
        },
      });
    }

    await createSession(user.id);

    return NextResponse.redirect(`${baseUrl}/dashboard`);
  } catch (err: any) {
    console.error(`OAuth ${name} Error:`, err);
    return NextResponse.redirect(`${baseUrl}/login?error=OAuth+Failed`);
  }
}

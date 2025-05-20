// This file is intentionally left empty as Google Sign-In and its associated token management have been removed.
// If other authentication methods are added in the future that require server-side token handling,
// this route could be repurposed.

import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.json({ error: "Google OAuth token management has been disabled." }, { status: 404 });
}

export async function POST(request: Request) {
  return NextResponse.json({ error: "Google OAuth token management has been disabled." }, { status: 404 });
}

import { NextResponse } from "next/server";

/** Build identity used by deployment automation to verify the live web image. */
export function GET() {
  return NextResponse.json({
    success: true,
    data: {
      surface: "web",
      version: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "unknown",
      gitSha: process.env.NEXT_PUBLIC_GIT_SHA?.trim() || "unknown",
      buildId: process.env.NEXT_PUBLIC_BUILD_ID?.trim() || "unknown",
      versionFileSha: process.env.NEXT_PUBLIC_VERSION_FILE_SHA?.trim() || null,
    },
  });
}

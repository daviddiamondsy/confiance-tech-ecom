import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Payment processing is no longer available" },
    { status: 410 }
  );
}

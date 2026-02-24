import { NextResponse } from "next/server";
import { getUnreadCount } from "@/app/actions/notifications";

export async function GET() {
  const { count } = await getUnreadCount();
  return NextResponse.json({ count });
}

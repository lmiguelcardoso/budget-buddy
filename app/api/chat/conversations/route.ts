import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireActiveUser, authErrorResponse } from "@/lib/auth";
import { ok, serverError } from "@/lib/response";

export async function GET() {
  try {
    const user = await requireActiveUser();
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });
    return NextResponse.json(ok(conversations));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to fetch conversations"));
  }
}

export async function POST() {
  try {
    const user = await requireActiveUser();
    const conversation = await prisma.conversation.create({
      data: { userId: user.id },
      select: { id: true, title: true },
    });
    return NextResponse.json(ok(conversation), { status: 201 });
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to create conversation"));
  }
}

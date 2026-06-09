import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser, authErrorResponse } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { buildFinancialContext } from "@/lib/chat-context";
import { openai, CHAT_MODEL } from "@/lib/openai";

const sendSchema = z.object({ content: z.string().min(1).max(4000) });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!conversation) return NextResponse.json(notFound("Conversation not found"), { status: 404 });

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true, role: true, content: true, createdAt: true },
    });
    return NextResponse.json(ok(messages));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to fetch messages"));
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireActiveUser();
    const { id } = await params;

    const body = sendSchema.safeParse(await req.json());
    if (!body.success) return NextResponse.json(badRequest(body.error.issues[0].message), { status: 400 });

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!conversation) return NextResponse.json(notFound("Conversation not found"), { status: 404 });

    const existingMessages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    await prisma.message.create({
      data: { conversationId: id, role: "user", content: body.data.content },
    });

    // Set conversation title from the first user message
    if (existingMessages.length === 0) {
      await prisma.conversation.update({
        where: { id },
        data: { title: body.data.content.slice(0, 60) },
      });
    }

    const context = await buildFinancialContext(user.id);

    const completion = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a personal finance assistant. Answer questions about the user's portfolio accurately and concisely. Suggest actionable insights when relevant. Do not make up data not present in the portfolio below.\n\n--- PORTFOLIO ---\n${context}`,
        },
        ...existingMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: body.data.content },
      ],
    });

    const reply = completion.choices[0].message.content ?? "";

    const saved = await prisma.message.create({
      data: { conversationId: id, role: "assistant", content: reply },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    return NextResponse.json(ok(saved), { status: 201 });
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to send message"));
  }
}

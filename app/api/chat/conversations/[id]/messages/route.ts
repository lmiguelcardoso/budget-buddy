import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser, authErrorResponse } from "@/lib/auth";
import { ok, badRequest, notFound, serverError } from "@/lib/response";
import { buildFinancialContext } from "@/lib/chat-context";
import { getModel, generateText, type AiProvider } from "@/lib/ai";
import { decrypt } from "@/lib/encryption";
import { createLogger } from "@/lib/logger";

const logger = createLogger("chat/messages");
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

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aiProvider: true, aiApiKey: true },
    });

    if (!userRecord?.aiApiKey || !userRecord?.aiProvider) {
      logger.warn("no ai key configured", { userId: user.id, conversationId: id });
      return NextResponse.json(
        badRequest("No AI API key configured. Add your key in Settings."),
        { status: 400 }
      );
    }

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

    if (existingMessages.length === 0) {
      await prisma.conversation.update({
        where: { id },
        data: { title: body.data.content.slice(0, 60) },
      });
    }

    const [context, apiKey] = await Promise.all([
      buildFinancialContext(user.id),
      Promise.resolve(decrypt(userRecord.aiApiKey)),
    ]);

    const provider = userRecord.aiProvider as AiProvider;
    const model = getModel(provider, apiKey);

    logger.info("calling ai", { userId: user.id, conversationId: id, provider, historyLength: existingMessages.length });

    const result = await generateText({
      model,
      system: `You are a personal finance assistant. Answer questions about the user's portfolio accurately and concisely. Suggest actionable insights when relevant. Do not make up data not present in the portfolio below.\n\n--- PORTFOLIO ---\n${context}`,
      messages: [
        ...existingMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: body.data.content },
      ],
    });

    logger.info("ai result", { keys: Object.keys(result), text: result.text, finishReason: (result as Record<string, unknown>).finishReason });

    const text = result.text ?? (result as Record<string, unknown>).content as string ?? "";

    if (!text) {
      logger.warn("empty ai response", { userId: user.id, provider, result: JSON.stringify(result) });
    }

    const saved = await prisma.message.create({
      data: { conversationId: id, role: "assistant", content: text },
      select: { id: true, role: true, content: true, createdAt: true },
    });

    await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });

    logger.info("message sent", { userId: user.id, conversationId: id, provider });
    return NextResponse.json(ok(saved), { status: 201 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return NextResponse.json(authRes);

    const message = error instanceof Error ? error.message : "Failed to send message";
    logger.error("send message failed", { error: message, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(serverError(message));
  }
}

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

    // Only fetch valid alternating history: skip any orphaned messages
    // from previous failed sends (user msg with no assistant reply)
    const allMessages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      select: { role: true, content: true },
    });

    // Build a clean alternating history (must start with user, alternate roles)
    const history: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of allMessages) {
      const last = history[history.length - 1];
      if (last && last.role === m.role) continue; // skip consecutive same-role messages
      history.push({ role: m.role as "user" | "assistant", content: m.content });
    }

    const isFirstMessage = allMessages.length === 0;

    const [context, apiKey] = await Promise.all([
      buildFinancialContext(user.id),
      Promise.resolve(decrypt(userRecord.aiApiKey)),
    ]);

    const provider = userRecord.aiProvider as AiProvider;
    const model = getModel(provider, apiKey);

    logger.info("calling ai", { userId: user.id, conversationId: id, provider, historyLength: history.length });

    const result = await generateText({
      model,
      system: `You are a personal finance assistant. Answer questions about the user's portfolio accurately and concisely. Suggest actionable insights when relevant. Do not make up data not present in the portfolio below.\n\n--- PORTFOLIO ---\n${context}`,
      messages: [
        ...history,
        { role: "user", content: body.data.content },
      ],
    });

    const text = result.text;

    // Save user message + assistant reply atomically
    const [, saved] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, role: "user", content: body.data.content },
      }),
      prisma.message.create({
        data: { conversationId: id, role: "assistant", content: text },
        // select is not directly supported on transaction items,
        // so we select all and project below
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(isFirstMessage ? { title: body.data.content.slice(0, 60) } : {}),
        },
      }),
    ]);

    const response = {
      id: saved.id,
      role: saved.role,
      content: saved.content,
      createdAt: saved.createdAt,
    };

    logger.info("message sent", { userId: user.id, conversationId: id, provider });
    return NextResponse.json(ok(response), { status: 201 });
  } catch (error) {
    const authRes = authErrorResponse(error);
    if (authRes) return NextResponse.json(authRes);

    const message = error instanceof Error ? error.message : "Failed to send message";
    logger.error("send message failed", { error: message, stack: error instanceof Error ? error.stack : undefined });
    return NextResponse.json(serverError(message));
  }
}

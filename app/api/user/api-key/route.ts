import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser, authErrorResponse } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/lib/response";
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption";
import type { AiProvider } from "@/lib/ai";

const AI_PROVIDERS = ["OPENAI", "GEMINI", "ANTHROPIC"] as const;

const saveSchema = z.object({
  provider: z.enum(AI_PROVIDERS),
  key: z.string().min(1),
});

export async function GET() {
  try {
    const user = await requireActiveUser();
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { aiProvider: true, aiApiKey: true },
    });
    if (!record?.aiApiKey) {
      return NextResponse.json(ok({ hasKey: false, provider: null, maskedKey: null }));
    }
    const decrypted = decrypt(record.aiApiKey);
    return NextResponse.json(ok({ hasKey: true, provider: record.aiProvider, maskedKey: maskApiKey(decrypted) }));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to fetch API key"));
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireActiveUser();
    const body = saveSchema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json(badRequest(body.error.issues[0].message), { status: 400 });
    }
    const encrypted = encrypt(body.data.key);
    await prisma.user.update({
      where: { id: user.id },
      data: { aiProvider: body.data.provider as AiProvider, aiApiKey: encrypted },
    });
    return NextResponse.json(ok({ provider: body.data.provider, maskedKey: maskApiKey(body.data.key) }));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to save API key"));
  }
}

export async function DELETE() {
  try {
    const user = await requireActiveUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { aiProvider: null, aiApiKey: null },
    });
    return NextResponse.json(ok(null));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to remove API key"));
  }
}

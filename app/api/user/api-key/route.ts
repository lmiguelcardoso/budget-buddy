import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireActiveUser, authErrorResponse } from "@/lib/auth";
import { ok, badRequest, serverError } from "@/lib/response";
import { encrypt, decrypt, maskApiKey } from "@/lib/encryption";

const saveSchema = z.object({
  key: z.string().min(1).refine((k) => k.startsWith("sk-"), {
    message: "Must be a valid OpenAI API key (starts with sk-)",
  }),
});

export async function GET() {
  try {
    const user = await requireActiveUser();
    const record = await prisma.user.findUnique({
      where: { id: user.id },
      select: { openaiApiKey: true },
    });
    if (!record?.openaiApiKey) {
      return NextResponse.json(ok({ hasKey: false, maskedKey: null }));
    }
    const decrypted = decrypt(record.openaiApiKey);
    return NextResponse.json(ok({ hasKey: true, maskedKey: maskApiKey(decrypted) }));
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
      data: { openaiApiKey: encrypted },
    });
    return NextResponse.json(ok({ maskedKey: maskApiKey(body.data.key) }));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to save API key"));
  }
}

export async function DELETE() {
  try {
    const user = await requireActiveUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { openaiApiKey: null },
    });
    return NextResponse.json(ok(null));
  } catch (error) {
    return NextResponse.json(authErrorResponse(error) ?? serverError("Failed to remove API key"));
  }
}

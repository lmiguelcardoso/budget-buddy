import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ChatClient } from "@/components/chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const user = await getCurrentUser();
  if (user?.status !== "ACTIVE") redirect("/login");

  const conversations = await prisma.conversation.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  });

  return (
    <ChatClient
      initialConversations={conversations.map((c) => ({
        ...c,
        updatedAt: c.updatedAt.toISOString(),
      }))}
    />
  );
}

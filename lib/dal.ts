import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Role, getRequiredApproverRoles } from "@/lib/types/enums";

// ─── Oturum ──────────────────────────────────────────────────────────────────

export const getSession = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
});

// ─── Kullanıcı ───────────────────────────────────────────────────────────────

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
      managerId: true,
    },
  });
  if (!user) redirect("/login");
  return user;
});

// ─── Talepler ────────────────────────────────────────────────────────────────

// Çalışanın kendi talepleri
export const getMyRequests = cache(async () => {
  const user = await getCurrentUser();
  return prisma.purchaseRequest.findMany({
    where: { requesterId: user.id },
    include: {
      approvals: {
        include: { approver: { select: { id: true, name: true, role: true } } },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

// Onaylaması bekleyen talepler (approver = mevcut kullanıcı)
export const getPendingApprovals = cache(async () => {
  const user = await getCurrentUser();
  return prisma.purchaseRequest.findMany({
    where: {
      approvals: {
        some: {
          approverId: user.id,
          status: "PENDING",
        },
      },
      status: "PENDING",
    },
    include: {
      requester: { select: { id: true, name: true, department: true } },
      approvals: {
        include: { approver: { select: { id: true, name: true, role: true } } },
        orderBy: { step: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
});

// Tek talep detayı
export const getRequestById = cache(async (id: string) => {
  const user = await getCurrentUser();
  const request = await prisma.purchaseRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { id: true, name: true, department: true, role: true } },
      approvals: {
        include: { approver: { select: { id: true, name: true, role: true } } },
        orderBy: { step: "asc" },
      },
    },
  });
  if (!request) return null;

  // Erişim kontrolü: sadece talep sahibi veya onaylayıcılar görebilir
  const isRequester = request.requesterId === user.id;
  const isApprover = request.approvals.some((a) => a.approverId === user.id);
  if (!isRequester && !isApprover) return null;

  return request;
});

// Onaylayıcı bul (hiyerarşide yukara çık)
export async function findApproverId(
  requesterId: string,
  amount: number
): Promise<string> {
  const targetRoles = getRequiredApproverRoles(amount);
  let currentUserId = requesterId;

  for (let depth = 0; depth < 10; depth++) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { managerId: true, manager: { select: { id: true, role: true } } },
    });
    if (!user?.manager) throw new Error("Uygun onaylayıcı bulunamadı.");
    if (targetRoles.includes(user.manager.role as Role)) return user.manager.id;
    currentUserId = user.manager.id;
  }

  throw new Error("Maksimum hiyerarşi derinliğine ulaşıldı.");
}

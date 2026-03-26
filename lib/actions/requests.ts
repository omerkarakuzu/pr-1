"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, findApproverId } from "@/lib/dal";

// ─── Yeni Talep Oluştur ───────────────────────────────────────────────────────

export type CreateRequestState =
  | { errors?: { title?: string[]; amount?: string[]; description?: string[] }; message?: string }
  | undefined;

export async function createRequestAction(
  _prev: CreateRequestState,
  formData: FormData
): Promise<CreateRequestState> {
  const user = await getCurrentUser();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();
  const amountRaw = formData.get("amount") as string;
  const amount = parseFloat(amountRaw);

  const errors: CreateRequestState["errors"] = {};
  if (!title || title.length < 3)
    errors.title = ["Başlık en az 3 karakter olmalıdır."];
  if (isNaN(amount) || amount <= 0)
    errors.amount = ["Geçerli bir tutar giriniz."];
  if (Object.keys(errors).length > 0) return { errors };

  const approverId = await findApproverId(user.id, amount);

  await prisma.purchaseRequest.create({
    data: {
      title,
      description: description || null,
      amount,
      status: "PENDING",
      requesterId: user.id,
      approvals: {
        create: { approverId, status: "PENDING", step: 1 },
      },
    },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// ─── Talep Onayla / Reddet ────────────────────────────────────────────────────

export type ApprovalActionState =
  | { error: string }
  | { success: true }
  | undefined;

export async function approveRequestAction(
  requestId: string,
  comment: string | undefined
): Promise<ApprovalActionState> {
  const user = await getCurrentUser();

  const approval = await prisma.approval.findFirst({
    where: { requestId, approverId: user.id, status: "PENDING" },
  });
  if (!approval) return { error: "Bu talep üzerinde onay yetkiniz yok." };

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "APPROVED", comment: comment || null },
    }),
    prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

export async function rejectRequestAction(
  requestId: string,
  comment: string | undefined
): Promise<ApprovalActionState> {
  const user = await getCurrentUser();

  const approval = await prisma.approval.findFirst({
    where: { requestId, approverId: user.id, status: "PENDING" },
  });
  if (!approval) return { error: "Bu talep üzerinde onay yetkiniz yok." };

  await prisma.$transaction([
    prisma.approval.update({
      where: { id: approval.id },
      data: { status: "REJECTED", comment: comment || null },
    }),
    prisma.purchaseRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    }),
  ]);

  revalidatePath("/dashboard");
  revalidatePath(`/requests/${requestId}`);
  return { success: true };
}

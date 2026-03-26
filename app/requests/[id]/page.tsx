import { notFound } from "next/navigation";
import Link from "next/link";
import { getRequestById, getCurrentUser } from "@/lib/dal";
import { Badge } from "@/components/ui/badge";
import {
  RoleLabel,
  RequestStatusLabel,
  ApprovalStatusLabel,
  RequestStatus,
  ApprovalStatus,
} from "@/lib/types/enums";
import { ApprovalActions } from "./approval-actions";

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === RequestStatus.APPROVED) return "default";
  if (status === RequestStatus.REJECTED) return "destructive";
  return "secondary";
}

function approvalVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === ApprovalStatus.APPROVED) return "default";
  if (status === ApprovalStatus.REJECTED) return "destructive";
  return "outline";
}

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [request, user] = await Promise.all([
    getRequestById(id),
    getCurrentUser(),
  ]);

  if (!request) notFound();

  const pendingApproval = request.approvals.find(
    (a) => a.approverId === user.id && a.status === ApprovalStatus.PENDING,
  );
  const isApprover = !!pendingApproval;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      {/* Geri butonu */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← Dashboard
      </Link>

      {/* Başlık + durum */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          {request.title}
        </h1>
        <Badge variant={statusVariant(request.status)}>
          {RequestStatusLabel[
            request.status as keyof typeof RequestStatusLabel
          ] ?? request.status}
        </Badge>
      </div>

      {/* Detay kartı */}
      <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
          <Row label="Tutar">
            {new Intl.NumberFormat("tr-TR", {
              style: "currency",
              currency: "USD",
            }).format(Number(request.amount))}
          </Row>
          <Row label="Talep Eden">
            {request.requester.name}
            {request.requester.department && (
              <span className="ml-1 text-zinc-400">
                — {request.requester.department}
              </span>
            )}
          </Row>
          <Row label="Oluşturulma">
            {new Date(request.createdAt).toLocaleString("tr-TR")}
          </Row>
          {request.description && (
            <Row label="Açıklama">
              <span className="whitespace-pre-wrap">{request.description}</span>
            </Row>
          )}
        </dl>
      </div>

      {/* Onay geçmişi */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Onay Süreci
        </h2>
        <ol className="space-y-3">
          {request.approvals.map((approval) => (
            <li
              key={approval.id}
              className="flex items-start gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold dark:bg-zinc-800">
                {approval.step}
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {approval.approver.name}
                </p>
                <p className="text-xs text-zinc-400">
                  {RoleLabel[
                    approval.approver.role as keyof typeof RoleLabel
                  ] ?? approval.approver.role}
                </p>
                {approval.comment && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                    "{approval.comment}"
                  </p>
                )}
              </div>
              <Badge variant={approvalVariant(approval.status)}>
                {ApprovalStatusLabel[
                  approval.status as keyof typeof ApprovalStatusLabel
                ] ?? approval.status}
              </Badge>
            </li>
          ))}
        </ol>
      </div>

      {/* Onaylayıcı aksiyonları */}
      {isApprover && <ApprovalActions requestId={request.id} />}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-5 py-3 sm:flex-row sm:gap-8">
      <dt className="w-32 shrink-0 text-sm font-medium text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-900 dark:text-zinc-50">{children}</dd>
    </div>
  );
}

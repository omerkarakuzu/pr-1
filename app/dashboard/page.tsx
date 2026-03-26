import { signOut } from "@/auth";
import { getCurrentUser, getMyRequests, getPendingApprovals } from "@/lib/dal";
import { RoleLabel, RequestStatusLabel, Role } from "@/lib/types/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
};

const APPROVER_ROLES: Role[] = [
  Role.MANAGER,
  Role.DIRECTOR,
  Role.GM_ASSISTANT,
  Role.GM,
  Role.BOARD_MEMBER,
];

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isApprover = APPROVER_ROLES.includes(user.role as Role);

  const [myRequests, pendingApprovals] = await Promise.all([
    getMyRequests(),
    isApprover ? getPendingApprovals() : Promise.resolve([]),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="font-semibold text-zinc-900 dark:text-zinc-50">
            Satın Alma Talep Sistemi
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.name} —{" "}
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {RoleLabel[user.role as Role]}
              </span>
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <Button variant="outline" size="sm" type="submit">
                Çıkış
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-10 px-6 py-10">
        {/* Onay Bekleyenler — sadece onaylayıcı rollerde göster */}
        {isApprover && pendingApprovals.length > 0 && (
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Onay Bekleyen Talepler
              </h2>
              <Badge variant="destructive">{pendingApprovals.length}</Badge>
            </div>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Talep Eden</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingApprovals.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>
                        {req.requester.name}
                        {req.requester.department && (
                          <span className="ml-1 text-zinc-400">
                            · {req.requester.department}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        ${req.amount.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/requests/${req.id}`}>İncele</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}

        {/* Taleplerim */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Taleplerim
            </h2>
            <Button asChild size="sm">
              <Link href="/requests/new">+ Yeni Talep</Link>
            </Button>
          </div>

          {myRequests.length === 0 ? (
            <p className="text-sm text-zinc-500">Henüz bir talebiniz yok.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Başlık</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>
                        ${req.amount.toLocaleString("tr-TR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[req.status] ?? "outline"}>
                          {RequestStatusLabel[
                            req.status as keyof typeof RequestStatusLabel
                          ] ?? req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/requests/${req.id}`}>Detay</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

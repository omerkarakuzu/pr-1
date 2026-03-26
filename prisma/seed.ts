/**
 * Seed dosyası — MSSQL mock data
 *
 * Şirket hiyerarşisi:
 *
 * Ahmet Yılmaz        (BOARD_MEMBER)
 * └── Mehmet Kaya     (GM)
 *     ├── Ayşe Demir  (GM_ASSISTANT)  — Teknoloji kolonu
 *     │   ├── Ali Şahin (DIRECTOR)
 *     │   │   ├── Zeynep Arslan (MANAGER)
 *     │   │   │   ├── Mert Aydın   (EMPLOYEE)
 *     │   │   │   └── Selin Kılıç  (EMPLOYEE)
 *     │   │   └── Can Öztürk (MANAGER)
 *     │   │       └── Baran Yıldız (EMPLOYEE)
 *     │   └── Emre Koç (DIRECTOR)
 *     │       └── Derya Çelik (MANAGER)
 *     │           └── Hande Yılmaz (EMPLOYEE)
 *     └── Fatma Arslan (GM_ASSISTANT) — Operasyon kolonu
 *         └── Osman Güneş (DIRECTOR)
 *             └── Kemal Doğan (MANAGER)
 *                 └── Pınar Şahin (EMPLOYEE)
 *
 * Talep örnekleri:
 *   - Mert Aydın     → $150   → MANAGER (Zeynep Arslan)        onaylayacak
 *   - Selin Kılıç    → $2500  → GM_ASSISTANT (Ayşe Demir)      onaylayacak
 *   - Baran Yıldız   → $15000 → BOARD_MEMBER (Ahmet Yılmaz)    onaylayacak
 *   - Kemal Doğan    → $500   → GM_ASSISTANT (Fatma Arslan)     onaylayacak
 *   - Derya Çelik    → $75    → DIRECTOR (Emre Koç)             onaylayacak
 *   - Pınar Şahin    → $8000  → GM_ASSISTANT (Fatma Arslan)     onaylayacak (APPROVED örneği)
 *   - Hande Yılmaz   → $250   → MANAGER (Derya Çelik)           onaylayacak (REJECTED örneği)
 */

import { PrismaClient } from "../lib/generated/prisma/client";

const prisma = new PrismaClient();

// Rol sabitleri (SQL Server'da enum desteklenmediğinden string kullanıyoruz)
const Role = {
  EMPLOYEE: "EMPLOYEE",
  MANAGER: "MANAGER",
  DIRECTOR: "DIRECTOR",
  GM_ASSISTANT: "GM_ASSISTANT",
  GM: "GM",
  BOARD_MEMBER: "BOARD_MEMBER",
} as const;
type Role = (typeof Role)[keyof typeof Role];

const RequestStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

const ApprovalStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// Onaylayıcı hesaplama mantığı
// Hiyerarşide yukara çıkarak ilgili rolü bulan yardımcı fonksiyon.
// amount < 300    → ilk MANAGER veya DIRECTOR
// 300-10000       → ilk GM_ASSISTANT veya GM
// > 10000         → BOARD_MEMBER
function getRequiredApproverRoles(amount: number): Role[] {
  if (amount <= 300) return [Role.MANAGER, Role.DIRECTOR];
  if (amount <= 10000) return [Role.GM_ASSISTANT, Role.GM];
  return [Role.BOARD_MEMBER];
}

async function findApprover(
  requesterId: string,
  amount: number
): Promise<string> {
  const targetRoles = getRequiredApproverRoles(amount);

  // Hiyerarşide yukara çık
  let currentUserId = requesterId;

  for (let depth = 0; depth < 10; depth++) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { managerId: true, manager: { select: { id: true, role: true } } },
    });

    if (!user?.manager) {
      throw new Error(
        `Hiyerarşide uygun onaylayıcı bulunamadı (userId: ${requesterId}, amount: ${amount})`
      );
    }

    if (targetRoles.includes(user.manager.role as Role)) {
      return user.manager.id;
    }

    currentUserId = user.manager.id;
  }

  throw new Error("Maksimum hiyerarşi derinliğine ulaşıldı.");
}

async function main() {
  console.log("🌱 Seed başlatılıyor...\n");

  // ─── Kullanıcılar ───────────────────────────────────────────────────────────
  // Tüm seed kullanıcıları için şifre: Password123!
  const PLACEHOLDER_HASH =
    "$2b$10$yHE2ZSvd7DrI/c8tCSsEWuwOksISStAk1nyxGj1XvT2xiVu6qSwGC";

  // 1. YK Üyesi
  const ahmet = await prisma.user.upsert({
    where: { email: "ahmet.yilmaz@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Ahmet Yılmaz",
      email: "ahmet.yilmaz@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.BOARD_MEMBER,
      department: "Yönetim Kurulu",
    },
  });

  // 2. Genel Müdür
  const mehmet = await prisma.user.upsert({
    where: { email: "mehmet.kaya@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Mehmet Kaya",
      email: "mehmet.kaya@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.GM,
      department: "Genel Müdürlük",
      managerId: ahmet.id,
    },
  });

  // 3a. GMY — Teknoloji
  const ayse = await prisma.user.upsert({
    where: { email: "ayse.demir@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Ayşe Demir",
      email: "ayse.demir@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.GM_ASSISTANT,
      department: "Teknoloji",
      managerId: mehmet.id,
    },
  });

  // 3b. GMY — Operasyon
  const fatma = await prisma.user.upsert({
    where: { email: "fatma.arslan@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Fatma Arslan",
      email: "fatma.arslan@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.GM_ASSISTANT,
      department: "Operasyon",
      managerId: mehmet.id,
    },
  });

  // 4a. Direktör — Yazılım
  const ali = await prisma.user.upsert({
    where: { email: "ali.sahin@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Ali Şahin",
      email: "ali.sahin@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.DIRECTOR,
      department: "Yazılım",
      managerId: ayse.id,
    },
  });

  // 4b. Direktör — Altyapı
  const emre = await prisma.user.upsert({
    where: { email: "emre.koc@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Emre Koç",
      email: "emre.koc@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.DIRECTOR,
      department: "Altyapı",
      managerId: ayse.id,
    },
  });

  // 4c. Direktör — Lojistik
  const osman = await prisma.user.upsert({
    where: { email: "osman.gunes@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Osman Güneş",
      email: "osman.gunes@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.DIRECTOR,
      department: "Lojistik",
      managerId: fatma.id,
    },
  });

  // 5a. Müdür — Frontend
  const zeynep = await prisma.user.upsert({
    where: { email: "zeynep.arslan@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Zeynep Arslan",
      email: "zeynep.arslan@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.MANAGER,
      department: "Frontend",
      managerId: ali.id,
    },
  });

  // 5b. Müdür — Backend
  const can = await prisma.user.upsert({
    where: { email: "can.ozturk@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Can Öztürk",
      email: "can.ozturk@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.MANAGER,
      department: "Backend",
      managerId: ali.id,
    },
  });

  // 5c. Müdür — DevOps
  const derya = await prisma.user.upsert({
    where: { email: "derya.celik@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Derya Çelik",
      email: "derya.celik@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.MANAGER,
      department: "DevOps",
      managerId: emre.id,
    },
  });

  // 5d. Müdür — Tedarik
  const kemal = await prisma.user.upsert({
    where: { email: "kemal.dogan@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Kemal Doğan",
      email: "kemal.dogan@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.MANAGER,
      department: "Tedarik",
      managerId: osman.id,
    },
  });

  // 6a. Çalışan — Frontend
  const mert = await prisma.user.upsert({
    where: { email: "mert.aydin@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Mert Aydın",
      email: "mert.aydin@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.EMPLOYEE,
      department: "Frontend",
      managerId: zeynep.id,
    },
  });

  const selin = await prisma.user.upsert({
    where: { email: "selin.kilic@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Selin Kılıç",
      email: "selin.kilic@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.EMPLOYEE,
      department: "Frontend",
      managerId: zeynep.id,
    },
  });

  // 6b. Çalışan — Backend
  const baran = await prisma.user.upsert({
    where: { email: "baran.yildiz@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Baran Yıldız",
      email: "baran.yildiz@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.EMPLOYEE,
      department: "Backend",
      managerId: can.id,
    },
  });

  // 6c. Çalışan — DevOps
  const hande = await prisma.user.upsert({
    where: { email: "hande.yilmaz@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Hande Yılmaz",
      email: "hande.yilmaz@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.EMPLOYEE,
      department: "DevOps",
      managerId: derya.id,
    },
  });

  // 6d. Çalışan — Tedarik
  const pinar = await prisma.user.upsert({
    where: { email: "pinar.sahin@sirket.com" },
    update: { password: PLACEHOLDER_HASH },
    create: {
      name: "Pınar Şahin",
      email: "pinar.sahin@sirket.com",
      password: PLACEHOLDER_HASH,
      role: Role.EMPLOYEE,
      department: "Tedarik",
      managerId: kemal.id,
    },
  });

  console.log("✅ Kullanıcılar oluşturuldu.\n");

  // ─── Satın Alma Talepleri ────────────────────────────────────────────────────

  const requestsData = [
    // 1) $150 — Mert → Zeynep (MANAGER) onaylayacak [PENDING]
    {
      requester: mert,
      title: "Ergonomik Klavye",
      description: "Geliştirici ekibi için mekanik klavye satın alımı.",
      amount: 150,
      status: RequestStatus.PENDING,
    },
    // 2) $2500 — Selin → Ayşe (GM_ASSISTANT) onaylayacak [PENDING]
    {
      requester: selin,
      title: "Yazılım Lisansı — Figma Takım Planı",
      description: "Frontend ekibi 12 aylık Figma Organization lisansı.",
      amount: 2500,
      status: RequestStatus.PENDING,
    },
    // 3) $15000 — Baran → Ahmet (BOARD_MEMBER) onaylayacak [PENDING]
    {
      requester: baran,
      title: "Sunucu Donanımı Yükseltmesi",
      description:
        "Backend altyapısı için 2x Dell PowerEdge R750 sunucu satın alımı.",
      amount: 15000,
      status: RequestStatus.PENDING,
    },
    // 4) $500 — Kemal → Fatma (GM_ASSISTANT) onaylayacak [PENDING]
    {
      requester: kemal,
      title: "Depo Barkod Okuyucuları",
      description: "Tedarik deposu için 5 adet el tipi barkod okuyucu.",
      amount: 500,
      status: RequestStatus.PENDING,
    },
    // 5) $75 — Derya (MANAGER) → Emre (DIRECTOR) onaylayacak [PENDING]
    {
      requester: derya,
      title: "USB Hub",
      description: "DevOps masaüstü kurulumu için 7-port USB hub.",
      amount: 75,
      status: RequestStatus.PENDING,
    },
    // 6) $8000 — Pınar → Fatma (GM_ASSISTANT) onaylayacak [APPROVED]
    {
      requester: pinar,
      title: "Forklift Bakım Sözleşmesi",
      description: "Yıllık forklift periyodik bakım ve servis anlaşması.",
      amount: 8000,
      status: RequestStatus.APPROVED,
      approvalStatus: ApprovalStatus.APPROVED,
      approvalComment: "Bütçe dahilinde. Onaylanmıştır.",
    },
    // 7) $250 — Hande → Derya (MANAGER) onaylayacak [REJECTED]
    {
      requester: hande,
      title: "Ekstra Monitoring Ekranı",
      description: "Sunucu izleme dashboardu için ikinci monitör.",
      amount: 250,
      status: RequestStatus.REJECTED,
      approvalStatus: ApprovalStatus.REJECTED,
      approvalComment:
        "Bu dönem donanım bütçesi tükenmiştir. Sonraki çeyreğe ertelensin.",
    },
  ] as const;

  for (const data of requestsData) {
    const approverId = await findApprover(data.requester.id, data.amount);

    const finalStatus =
      "approvalStatus" in data ? data.approvalStatus : ApprovalStatus.PENDING;
    const finalComment =
      "approvalComment" in data ? data.approvalComment : null;

    await prisma.purchaseRequest.create({
      data: {
        title: data.title,
        description: data.description,
        amount: data.amount,
        status: data.status,
        requesterId: data.requester.id,
        approvals: {
          create: {
            approverId,
            status: finalStatus,
            step: 1,
            comment: finalComment,
          },
        },
      },
    });

    console.log(
      `  📋 "${data.title}" — $${data.amount} — Talep eden: ${data.requester.name} — Onaylayıcı ID: ${approverId}`
    );
  }

  console.log("\n✅ Satın alma talepleri oluşturuldu.");
  console.log("\n🎉 Seed tamamlandı.");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


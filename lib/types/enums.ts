/**
 * Prisma SQL Server connector native enum desteklemediği için
 * roller ve durum değerleri DB'de String olarak tutulur.
 * Bu dosya, uygulama genelinde tip güvenliği sağlar.
 */

export const Role = {
  EMPLOYEE: "EMPLOYEE", // Çalışan
  MANAGER: "MANAGER", // Müdür
  DIRECTOR: "DIRECTOR", // Direktör
  GM_ASSISTANT: "GM_ASSISTANT", // Genel Müdür Yardımcısı
  GM: "GM", // Genel Müdür
  BOARD_MEMBER: "BOARD_MEMBER", // YK Üyesi
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const RequestStatus = {
  PENDING: "PENDING", // Beklemede
  APPROVED: "APPROVED", // Onaylandı
  REJECTED: "REJECTED", // Reddedildi
  CANCELLED: "CANCELLED", // İptal edildi
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const ApprovalStatus = {
  PENDING: "PENDING", // Beklemede
  APPROVED: "APPROVED", // Onaylandı
  REJECTED: "REJECTED", // Reddedildi
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

// Onay için gerekli rolleri döndürür (approval routing mantığı)
export function getRequiredApproverRoles(amount: number): Role[] {
  if (amount <= 300) return [Role.MANAGER, Role.DIRECTOR];
  if (amount <= 10000) return [Role.GM_ASSISTANT, Role.GM];
  return [Role.BOARD_MEMBER];
}

// Rol etiketleri (UI'da göstermek için)
export const RoleLabel: Record<Role, string> = {
  [Role.EMPLOYEE]: "Çalışan",
  [Role.MANAGER]: "Müdür",
  [Role.DIRECTOR]: "Direktör",
  [Role.GM_ASSISTANT]: "Genel Müdür Yardımcısı",
  [Role.GM]: "Genel Müdür",
  [Role.BOARD_MEMBER]: "YK Üyesi",
};

export const RequestStatusLabel: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: "Beklemede",
  [RequestStatus.APPROVED]: "Onaylandı",
  [RequestStatus.REJECTED]: "Reddedildi",
  [RequestStatus.CANCELLED]: "İptal edildi",
};

export const ApprovalStatusLabel: Record<ApprovalStatus, string> = {
  [ApprovalStatus.PENDING]: "Beklemede",
  [ApprovalStatus.APPROVED]: "Onaylandı",
  [ApprovalStatus.REJECTED]: "Reddedildi",
};

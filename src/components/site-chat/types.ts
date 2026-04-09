export type UUID = string;
export type SenderType = "owner" | "team" | "partner" | "client" | "system";
export type ContentType = "text" | "image" | "file" | "system_event";
export type ParticipantRole = "owner" | "team" | "partner" | "client";

export interface SiteChatRoom {
  id: UUID;
  siteId: UUID;
  workspaceId: UUID;
  title: string;
  clientPortalSlug: string | null;
  clientPortalEnabled: boolean;
  isSample: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteChatMessage {
  id: UUID;
  roomId: UUID;
  senderId: string | null;
  senderType: SenderType;
  senderDisplayName: string;
  content: string | null;
  contentType: ContentType;
  replyToId: UUID | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  attachments?: SiteChatAttachment[];
  // 낙관적 업데이트용
  _optimistic?: boolean;
  _failed?: boolean;
}

export interface SiteChatAttachment {
  id: UUID;
  messageId: UUID;
  storagePath: string;
  fileType: string | null;
  fileSize: number | null;
  thumbnailPath: string | null;
  exifTakenAt: string | null;
  autoCategorizedTag: string | null;
  createdAt: string;
}

export interface SiteChatParticipant {
  id: UUID;
  roomId: UUID;
  userId: string | null;
  role: ParticipantRole;
  displayName: string;
  lastReadAt: string | null;
  notificationEnabled: boolean;
}

export interface PinnedSummary {
  roomId: UUID;
  currentProgressPercent: number;
  nextMilestoneTitle: string | null;
  nextMilestoneDate: string | null;
  pendingPaymentAmount: number;
  pendingPaymentDueDate: string | null;
  openDefectsCount: number;
  photoCount?: number;
  updatedAt: string;
}

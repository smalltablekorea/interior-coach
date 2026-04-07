export type DefectSeverity = "minor" | "major" | "critical";
export type DefectStatus = "reported" | "in_progress" | "resolved" | "closed";

export interface Defect {
  id: string;
  siteId: string;
  siteName?: string;
  tradeId: string;
  tradeName: string;
  title: string;
  description: string | null;
  photoUrls: string[] | null;
  severity: DefectSeverity;
  status: DefectStatus;
  reportedBy: string | null;
  assignedTo: string | null;
  assignedToName: string | null;
  resolutionNote: string | null;
  resolutionPhotoUrls: string[] | null;
  reportedAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDefectRequest {
  siteId: string;
  tradeId: string;
  tradeName: string;
  title: string;
  description?: string;
  photoUrls?: string[];
  severity: DefectSeverity;
  assignedTo?: string;
  assignedToName?: string;
}

export interface UpdateDefectRequest {
  title?: string;
  description?: string;
  photoUrls?: string[];
  severity?: DefectSeverity;
  status?: DefectStatus;
  assignedTo?: string;
  assignedToName?: string;
  resolutionNote?: string;
  resolutionPhotoUrls?: string[];
}

export interface DefectStats {
  total: number;
  reported: number;
  inProgress: number;
  resolved: number;
  closed: number;
  bySeverity: { minor: number; major: number; critical: number };
}

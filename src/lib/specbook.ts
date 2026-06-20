/**
 * 스펙북 공통 헬퍼 + 카탈로그 데이터 형 정의.
 */

export interface SpecOption {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  spec?: string;
  price?: number;
  memo?: string;
  imageUrl?: string;
  color?: string;
}

export interface SpecCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  options: SpecOption[];
}

export interface SpecbookCatalogData {
  categories: SpecCategory[];
  notes?: string;
}

export const DEFAULT_CATEGORIES_TEMPLATE: SpecCategory[] = [
  { id: "floor", name: "마루/바닥재", icon: "🟫", options: [] },
  { id: "wall", name: "벽지/도배", icon: "🪟", options: [] },
  { id: "tile", name: "타일", icon: "◽", options: [] },
  { id: "kitchen", name: "주방가구·상판", icon: "🍳", options: [] },
  { id: "bath", name: "욕실·도기", icon: "🛁", options: [] },
  { id: "door", name: "도어·문틀", icon: "🚪", options: [] },
  { id: "light", name: "조명", icon: "💡", options: [] },
  { id: "paint", name: "도장·페인트", icon: "🎨", options: [] },
  { id: "kitchen-elec", name: "주방가전·후드", icon: "🔌", options: [] },
  { id: "etc", name: "기타", icon: "🧩", options: [] },
];

export function emptyCatalog(): SpecbookCatalogData {
  return { categories: DEFAULT_CATEGORIES_TEMPLATE.map((c) => ({ ...c, options: [] })) };
}

export function generateToken(): string {
  // URL-safe 24-char (uppercase letters + digits)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 24; i++) token += chars[bytes[i] % chars.length];
  return token;
}

export type SubmissionStatus = "new" | "confirmed";

export interface SubmissionSelection {
  categoryId: string;
  categoryName: string;
  optionId: string;
  optionName: string;
  brand?: string;
  model?: string;
  spec?: string;
  price?: number;
  imageUrl?: string;
  color?: string;
  memo?: string;
}

export function validateCatalogShape(value: unknown): value is SpecbookCatalogData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (!Array.isArray(v.categories)) return false;
  for (const c of v.categories) {
    if (!c || typeof c !== "object") return false;
    const cc = c as Record<string, unknown>;
    if (typeof cc.id !== "string" || typeof cc.name !== "string") return false;
    if (!Array.isArray(cc.options)) return false;
    for (const o of cc.options) {
      if (!o || typeof o !== "object") return false;
      const oo = o as Record<string, unknown>;
      if (typeof oo.id !== "string" || typeof oo.name !== "string") return false;
    }
  }
  return true;
}

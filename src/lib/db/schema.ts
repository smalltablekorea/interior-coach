import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uuid,
  date,
  unique,
  serial,
} from "drizzle-orm/pg-core";

// ─── 업체 정보 (레거시) ───

export const companies = pgTable("companies", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  ceoName: text("ceo_name"),
  businessNumber: text("business_number").unique(),
  phone: text("phone"),
  address: text("address"),
  plan: text("plan").notNull().default("free"), // free | starter | pro | enterprise
  planExpiresAt: timestamp("plan_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// ─── 워크스페이스 (멀티테넌트) ───

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  businessType: text("business_type").default("residential"), // residential, commercial, both
  businessNumber: text("business_number"),
  ownerId: text("owner_id").notNull(),
  inviteCode: text("invite_code").unique(),
  inviteExpiresAt: timestamp("invite_expires_at"),
  plan: text("plan").notNull().default("free"), // free, starter, pro, enterprise
  maxMembers: integer("max_members").notNull().default(5),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Better Auth 테이블 ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
  companyId: uuid("company_id").references(() => companies.id),
  role: text("role").default("owner"), // owner | manager | worker
  activeWorkspaceId: uuid("active_workspace_id"), // 현재 활성 워크스페이스
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 워크스페이스 멤버/권한/초대 ───

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  role: text("role").notNull().default("member"), // owner, admin, manager, member, viewer
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  unique("workspace_members_workspace_user_idx").on(table.workspaceId, table.userId),
]);

export const workspacePermissions = pgTable("workspace_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  memberId: uuid("member_id")
    .notNull()
    .references(() => workspaceMembers.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // site_management, estimates, marketing, accounting, customers, settings
  accessLevel: text("access_level").notNull().default("none"), // none, read, write, admin
}, (table) => [
  unique("workspace_permissions_member_category_idx").on(table.memberId, table.category),
]);

export const workspaceInvitations = pgTable("workspace_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"), // admin, manager, member, viewer
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id),
  status: text("status").notNull().default("pending"), // pending, accepted, expired, revoked
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 고객 관리 ───

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  memo: text("memo"),
  status: text("status").default("상담중"), // 상담중, 계약완료, 시공중, 시공완료, A/S, VIP
  referredBy: uuid("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// ─── 현장 관리 ───

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  customerId: uuid("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  address: text("address"),
  buildingType: text("building_type"), // 아파트, 빌라, 오피스텔, 상가, 주택
  areaPyeong: real("area_pyeong"),
  status: text("status").notNull().default("상담중"), // 상담중, 견적중, 계약완료, 시공중, 시공완료, A/S
  startDate: date("start_date"),
  endDate: date("end_date"),
  progress: integer("progress").default(0), // 0~100 전체 공정 진행률
  budget: integer("budget").default(0), // 예산 총액 (원)
  spent: integer("spent").default(0), // 지출 누적 (원)
  trades: jsonb("trades"), // string[] 투입 공종 ID 목록
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// ─── 견적 관리 ───

export const estimates = pgTable("estimates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  version: integer("version").notNull().default(1),
  totalAmount: integer("total_amount").default(0),
  profitRate: real("profit_rate").default(0),
  overheadRate: real("overhead_rate").default(0),
  vatEnabled: boolean("vat_enabled").default(true),
  status: text("status").notNull().default("작성중"), // 작성중, 발송, 승인, 거절
  memo: text("memo"),
  metadata: jsonb("metadata"), // 빌더 추가 데이터 (gradeKey, companyInfo 등)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const estimateItems = pgTable("estimate_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  estimateId: uuid("estimate_id")
    .notNull()
    .references(() => estimates.id, { onDelete: "cascade" }),
  category: text("category").notNull(), // 공종명
  itemName: text("item_name").notNull(),
  unit: text("unit"), // 식, m², 개, m
  quantity: real("quantity").default(1),
  unitPrice: integer("unit_price").default(0),
  amount: integer("amount").default(0),
  sortOrder: integer("sort_order").default(0),
  memo: text("memo"),
});

// ─── 계약 관리 ───

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  contractAmount: integer("contract_amount").notNull(),
  contractDate: date("contract_date"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const contractPayments = pgTable("contract_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  contractId: uuid("contract_id")
    .notNull()
    .references(() => contracts.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 계약금, 중도금, 잔금
  amount: integer("amount").notNull(),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  status: text("status").notNull().default("미수"), // 미수, 완납
  memo: text("memo"),
});

// ─── 시공 공정 관리 ───

export const constructionPhases = pgTable("construction_phases", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id),
  category: text("category").notNull(), // 공종명
  plannedStart: date("planned_start"),
  plannedEnd: date("planned_end"),
  actualStart: date("actual_start"),
  actualEnd: date("actual_end"),
  progress: integer("progress").notNull().default(0), // 0~100
  status: text("status").notNull().default("대기"), // 대기, 진행중, 완료, 보류
  sortOrder: integer("sort_order").default(0),
  memo: text("memo"),
});

// ─── 작업자 관리 ───

export const workers = pgTable("workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  phone: text("phone"),
  trade: text("trade").notNull(), // 직종 (목수, 전기, 설비 등)
  dailyWage: integer("daily_wage"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const phaseWorkers = pgTable("phase_workers", {
  id: uuid("id").defaultRandom().primaryKey(),
  phaseId: uuid("phase_id")
    .notNull()
    .references(() => constructionPhases.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id")
    .notNull()
    .references(() => workers.id),
  assignedDate: date("assigned_date").notNull(),
  dailyWage: integer("daily_wage"),
  memo: text("memo"),
});

// ─── 자재/재고 관리 ───

export const materials = pgTable("materials", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  category: text("category"), // 분류
  brand: text("brand"), // 브랜드
  grade: text("grade"), // 등급: 일반, 중급, 고급
  unit: text("unit"), // 개, 박스, m², 롤
  unitPrice: integer("unit_price"),
  supplier: text("supplier"),
  memo: text("memo"),
  isStandard: boolean("is_standard").notNull().default(false), // 표준 자재 여부
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const materialOrders = pgTable("material_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  materialId: uuid("material_id").references(() => materials.id),
  materialName: text("material_name").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: integer("unit_price").default(0),
  totalAmount: integer("total_amount").default(0),
  orderedDate: date("ordered_date"),
  deliveryDate: date("delivery_date"),
  status: text("status").notNull().default("발주"), // 발주, 배송중, 입고, 취소
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- 지출 관리 ---
export const expenses = pgTable("expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  category: text("category").notNull(), // 자재비, 인건비, 운반비, 장비비, 기타
  description: text("description"),
  amount: integer("amount").notNull().default(0),
  date: date("date"),
  paymentMethod: text("payment_method"), // 카드, 계좌이체, 현금
  vendor: text("vendor"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const inventory = pgTable("inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  materialId: uuid("material_id")
    .notNull()
    .references(() => materials.id),
  currentStock: real("current_stock").notNull().default(0),
  location: text("location"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
});

// ─── 시공 사진 ───

export const sitePhotos = pgTable("site_photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  date: date("date").notNull(),
  category: text("category"),
  phase: text("phase").default("during"), // before, during, after
  caption: text("caption"),
  uploadedBy: text("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const photoComments = pgTable("photo_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  photoId: uuid("photo_id")
    .notNull()
    .references(() => sitePhotos.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 소통 기록 ───

export const communicationLogs = pgTable("communication_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  date: date("date").notNull(),
  type: text("type").notNull(), // 전화, 문자, 방문, 카톡
  content: text("content"),
  staffName: text("staff_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 고객 포탈 토큰 ───

export const customerPortalTokens = pgTable("customer_portal_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 세무/회계 ───

export const taxRevenue = pgTable("tax_revenue", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  customerId: uuid("customer_id").references(() => customers.id),
  date: date("date").notNull(),
  type: text("type").notNull().default("construction"),
  description: text("description"),
  supplyAmount: integer("supply_amount").notNull(),
  vatAmount: integer("vat_amount").default(0),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method"),
  isCollected: boolean("is_collected").default(false),
  collectedAt: date("collected_at"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxExpenses = pgTable("tax_expenses", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  vendorId: uuid("vendor_id"),
  date: date("date").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  supplyAmount: integer("supply_amount").notNull(),
  vatAmount: integer("vat_amount").default(0),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method"),
  receiptUrl: text("receipt_url"),
  isDeductible: boolean("is_deductible").default(true),
  deductionNote: text("deduction_note"),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxVendors = pgTable("tax_vendors", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  businessNumber: text("business_number"),
  representative: text("representative"),
  businessType: text("business_type"),
  businessItem: text("business_item"),
  address: text("address"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  isFavorite: boolean("is_favorite").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxInvoices = pgTable("tax_invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  direction: text("direction").notNull(),
  invoiceNumber: text("invoice_number"),
  vendorId: uuid("vendor_id"),
  issueDate: date("issue_date").notNull(),
  supplyAmount: integer("supply_amount").notNull(),
  vatAmount: integer("vat_amount").notNull(),
  totalAmount: integer("total_amount").notNull(),
  items: jsonb("items"),
  status: text("status").default("issued"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxPayroll = pgTable("tax_payroll", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  workerId: uuid("worker_id").references(() => workers.id),
  workerName: text("worker_name").notNull(),
  workerType: text("worker_type").notNull(),
  payPeriod: text("pay_period"),
  workDays: integer("work_days"),
  grossAmount: integer("gross_amount").notNull(),
  incomeTax: integer("income_tax").default(0),
  localTax: integer("local_tax").default(0),
  nationalPension: integer("national_pension").default(0),
  healthInsurance: integer("health_insurance").default(0),
  employmentInsurance: integer("employment_insurance").default(0),
  netAmount: integer("net_amount").notNull(),
  isPaid: boolean("is_paid").default(false),
  paidAt: date("paid_at"),
  paymentMethod: text("payment_method"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxCalendar = pgTable("tax_calendar", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  title: text("title").notNull(),
  type: text("type"),
  dueDate: date("due_date").notNull(),
  status: text("status").default("upcoming"),
  description: text("description"),
  amount: integer("amount"),
  completedAt: timestamp("completed_at"),
  autoGenerated: boolean("auto_generated").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const taxAiConsultations = pgTable("tax_ai_consultations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 구독/요금제 ───

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id)
    .unique(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  plan: text("plan").notNull().default("free"),
  billingCycle: text("billing_cycle").default("monthly"),
  status: text("status").notNull().default("active"),
  tossBillingKey: text("toss_billing_key"),
  tossCustomerKey: text("toss_customer_key"),
  trialEndsAt: timestamp("trial_ends_at"),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  canceledAt: timestamp("canceled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usageRecords = pgTable("usage_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  feature: text("feature").notNull(),
  period: text("period").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billingRecords = pgTable("billing_records", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  subscriptionId: uuid("subscription_id").references(() => subscriptions.id),
  orderId: text("order_id").notNull().unique(),
  paymentKey: text("payment_key"),
  plan: text("plan").notNull(),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  amount: integer("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, failed, refunded, canceled
  tossResponse: jsonb("toss_response"),
  failReason: text("fail_reason"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 분석 크레딧 ───

export const analysisCredits = pgTable("analysis_credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id)
    .unique(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  totalCredits: integer("total_credits").notNull().default(0),
  usedCredits: integer("used_credits").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const analysisResults = pgTable("analysis_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  area: real("area").notNull(),
  grade: text("grade").notNull(),
  buildingType: text("building_type").default("apt"),
  profitRate: real("profit_rate").default(20),
  overheadRate: real("overhead_rate").default(6),
  vatEnabled: boolean("vat_enabled").default(false),
  resultData: jsonb("result_data"),
  creditUsed: boolean("credit_used").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 쓰레드 마케팅 자동화 ───

export const threadsAccount = pgTable("threads_account", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  username: text("username").notNull(),
  accessToken: text("access_token"),
  isConnected: boolean("is_connected").notNull().default(false),
  connectedAt: timestamp("connected_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const threadsTemplates = pgTable("threads_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  category: text("category").notNull(), // 시공완료, 시공팁, 고객후기, 프로모션, 일상
  contentTemplate: text("content_template").notNull(),
  hashtagTemplate: text("hashtag_template"),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const threadsPosts = pgTable("threads_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  title: text("title"),
  content: text("content").notNull(),
  hashtags: text("hashtags"),
  imageUrls: jsonb("image_urls"),
  status: text("status").notNull().default("작성중"), // 작성중, 예약, 발행완료, 실패
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  threadsPostId: text("threads_post_id"),
  likes: integer("likes").notNull().default(0),
  comments: integer("comments").notNull().default(0),
  views: integer("views").notNull().default(0),
  templateId: uuid("template_id"),
  autoRuleId: uuid("auto_rule_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const threadsAutoRules = pgTable("threads_auto_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 시공완료자동, 정기포스팅, 시공사진자동, 프로모션자동
  templateId: uuid("template_id").references(() => threadsTemplates.id),
  schedule: jsonb("schedule"),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  triggerCount: integer("trigger_count").notNull().default(0),
  config: jsonb("config"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const threadsComments = pgTable("threads_comments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  postId: uuid("post_id")
    .notNull()
    .references(() => threadsPosts.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  commentText: text("comment_text").notNull(),
  replyText: text("reply_text"),
  replyStatus: text("reply_status").notNull().default("대기"), // 대기, 완료, 건너뜀
  isAutoReply: boolean("is_auto_reply").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 마케팅 자동화 (공통) ───

export const marketingChannels = pgTable("marketing_channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  channel: text("channel").notNull(), // threads, instagram, naver_blog, youtube, meta_ads
  accountName: text("account_name"),
  accountId: text("account_id"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  settings: jsonb("settings"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingContent = pgTable("marketing_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  siteId: uuid("site_id").references(() => sites.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  contentType: text("content_type").notNull().default("text"), // text, image, carousel, video
  mediaUrls: jsonb("media_urls"), // string[]
  thumbnailUrl: text("thumbnail_url"),
  tags: jsonb("tags"), // string[]
  category: text("category"), // 시공사례, 비포애프터, 자재소개, 팁/노하우 등
  targetChannels: jsonb("target_channels"), // string[]
  aiGenerated: boolean("ai_generated").default(false),
  aiPrompt: text("ai_prompt"),
  status: text("status").notNull().default("draft"), // draft, ready, archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingPosts = pgTable("marketing_posts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  contentId: uuid("content_id").references(() => marketingContent.id),
  channel: text("channel").notNull(), // threads, instagram, naver_blog, youtube, meta_ads
  channelPostId: text("channel_post_id"),
  channelPostUrl: text("channel_post_url"),
  title: text("title"),
  body: text("body"),
  mediaUrls: jsonb("media_urls"),
  hashtags: jsonb("hashtags"), // string[]
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, publishing, published, failed
  errorMessage: text("error_message"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  engagement: jsonb("engagement"), // { likes, comments, shares, reach, impressions }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingInquiries = pgTable("marketing_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  customerId: uuid("customer_id").references(() => customers.id),
  customerName: text("customer_name").notNull(),
  phone: text("phone"),
  email: text("email"),
  channel: text("channel").notNull(), // 네이버, 인스타, 유튜브, 스레드, 지인소개, 현수막, 기타
  content: text("content"),
  status: text("status").notNull().default("신규"), // 신규, 상담중, 견적발송, 계약완료, 실패
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  channel: text("channel").notNull(),
  externalCampaignId: text("external_campaign_id"),
  name: text("name").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: integer("budget").default(0),
  spent: integer("spent").default(0),
  inquiries: integer("inquiries").default(0),
  contracts: integer("contracts").default(0),
  contractAmount: integer("contract_amount").default(0),
  status: text("status").default("active"), // active, paused, completed
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const marketingKeywords = pgTable("marketing_keywords", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  keyword: text("keyword").notNull(),
  channel: text("channel").notNull(), // naver, youtube, google
  currentRank: integer("current_rank"),
  previousRank: integer("previous_rank"),
  searchVolume: integer("search_volume"),
  targetUrl: text("target_url"),
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── SMS/알림톡 리드 자동화 ───

export const smsLeads = pgTable("sms_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  source: text("source").notNull().default("naver_cafe"), // naver_cafe, instagram, referral, manual, landing_page
  sourceUrl: text("source_url"),
  sourceKeyword: text("source_keyword"),
  grade: text("grade").default("C"), // A, B, C
  score: integer("score").default(0),
  scoringFactors: jsonb("scoring_factors"), // { urgency, budget, readiness, ... }
  status: text("status").notNull().default("new"), // new, contacted, responding, qualified, converted, lost
  customerId: uuid("customer_id").references(() => customers.id),
  area: text("area"), // 지역
  buildingType: text("building_type"),
  areaPyeong: real("area_pyeong"),
  budget: text("budget"),
  timeline: text("timeline"), // 시공 희망 시기
  memo: text("memo"),
  lastContactedAt: timestamp("last_contacted_at"),
  convertedAt: timestamp("converted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsCampaigns = pgTable("sms_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  type: text("type").notNull().default("drip"), // drip, blast, trigger
  status: text("status").notNull().default("draft"), // draft, active, paused, completed
  targetGrade: jsonb("target_grade"), // ["A", "B"]
  targetSource: jsonb("target_source"), // ["naver_cafe"]
  steps: jsonb("steps"), // [{ day: 0, channel: "sms", templateId: "..." }, ...]
  totalSent: integer("total_sent").default(0),
  totalDelivered: integer("total_delivered").default(0),
  totalOpened: integer("total_opened").default(0),
  totalConverted: integer("total_converted").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsOutreachLog = pgTable("sms_outreach_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  leadId: uuid("lead_id").references(() => smsLeads.id),
  campaignId: uuid("campaign_id").references(() => smsCampaigns.id),
  channel: text("channel").notNull().default("sms"), // sms, alimtalk
  templateType: text("template_type"), // first_contact, follow_up, portfolio, promotion, maintenance, referral
  content: text("content").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, delivered, failed, opened, clicked
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  externalMessageId: text("external_message_id"), // Solapi message ID
  errorMessage: text("error_message"),
  stepIndex: integer("step_index"), // drip campaign step
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const smsConversions = pgTable("sms_conversions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  leadId: uuid("lead_id").notNull().references(() => smsLeads.id),
  campaignId: uuid("campaign_id").references(() => smsCampaigns.id),
  outreachLogId: uuid("outreach_log_id").references(() => smsOutreachLog.id),
  type: text("type").notNull(), // consultation, estimate, contract
  amount: integer("amount"),
  memo: text("memo"),
  convertedAt: timestamp("converted_at").notNull().defaultNow(),
});

export const smsContent = pgTable("sms_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("sms"), // sms, alimtalk
  templateType: text("template_type").notNull(), // first_contact, follow_up, portfolio, promotion, maintenance, referral
  subject: text("subject"),
  body: text("body").notNull(),
  variables: jsonb("variables"), // ["{{고객명}}", "{{지역}}", ...]
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const smsCrawlLog = pgTable("sms_crawl_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  source: text("source").notNull(), // naver_cafe
  keyword: text("keyword").notNull(),
  postsScanned: integer("posts_scanned").default(0),
  leadsFound: integer("leads_found").default(0),
  status: text("status").notNull().default("running"), // running, completed, failed
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ─── 알림 시스템 ───

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  type: text("type").notNull(), // payment_overdue, phase_delayed, material_needed, contract_signed, site_completed, system
  title: text("title").notNull(),
  message: text("message"),
  link: text("link"), // 클릭 시 이동할 앱 내 경로
  metadata: jsonb("metadata"), // 추가 데이터 (siteId, contractId 등)
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── AI 공정매니저 (소비자용 공정표 플래너) ───

export const schedulePlans = pgTable("schedule_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  siteName: text("site_name").notNull(),
  siteAddress: text("site_address"),
  startDate: date("start_date").notNull(),
  memo: text("memo"),
  sizeId: text("size_id").notNull(), // 10s, 20s, 30s, 40s, 50p
  selectedTrades: jsonb("selected_trades").notNull(), // string[] of trade IDs
  season: text("season").notNull(), // spring, summer, fall, winter
  resultJson: jsonb("result_json"), // full buildSchedule output
  status: text("status").notNull().default("draft"), // draft, in_progress, completed
  tradeProgress: jsonb("trade_progress"), // Record<tradeId, { status, completedAt? }>
  isPublic: boolean("is_public").notNull().default(false),
  shareToken: text("share_token").unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Q&A 자동 생성 게시판 ───
export const qnaPosts = pgTable("qna_posts", {
  id: serial("id").primaryKey(),
  service: text("service").notNull().default("interior"),
  title: text("title").notNull(),
  content: text("content").notNull(),
  answer: text("answer"),
  authorId: text("author_id").notNull(), // "user_" + random 8 chars
  authorRole: text("author_role").notNull(), // ceo | director | manager | designer
  category: text("category").notNull(), // site_management | staff_management | revenue | client_handling | process | tools_system | other
  status: text("status").notNull().default("answered"), // answered | pending
  viewCount: integer("view_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull(),
  answeredAt: timestamp("answered_at"),
});

// ─── 하자관리 ───

export const defects = pgTable("defects", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  tradeId: text("trade_id").notNull(), // 공종 ID (demolition, plumbing 등)
  tradeName: text("trade_name").notNull(), // 공종 표시명 (철거, 배관 등)
  title: text("title").notNull(),
  description: text("description"),
  photoUrls: jsonb("photo_urls"), // string[]
  severity: text("severity").notNull(), // minor, major, critical
  status: text("status").notNull().default("reported"), // reported, in_progress, resolved, closed
  reportedBy: text("reported_by").references(() => user.id),
  assignedTo: text("assigned_to"), // 담당 업체/기사 ID 또는 이름
  assignedToName: text("assigned_to_name"),
  resolutionNote: text("resolution_note"),
  resolutionPhotoUrls: jsonb("resolution_photo_urls"), // string[]
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  closedAt: timestamp("closed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 일일 업무일지 ───

export const dailyLogs = pgTable("daily_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  authorName: text("author_name").notNull(),
  logDate: date("log_date").notNull(),
  tradesWorked: jsonb("trades_worked"), // string[] 공종 ID 배열
  tradesWorkedNames: jsonb("trades_worked_names"), // string[] 공종 표시명
  summary: text("summary").notNull(),
  detail: text("detail"),
  photoUrls: jsonb("photo_urls"), // string[]
  issues: text("issues"),
  nextDayPlan: text("next_day_plan"),
  weather: text("weather"), // sunny, cloudy, rainy, snowy, hot, cold
  workerCount: integer("worker_count").default(1),
  sharedToCustomer: boolean("shared_to_customer").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  unique("daily_logs_site_author_date_idx").on(table.siteId, table.userId, table.logDate),
]);

// ─── 수금관리 ───

export const billings = pgTable("billings", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  milestoneName: text("milestone_name").notNull(), // "철거 완료", "목공 완료" 등
  tradeId: text("trade_id"), // 연결된 공종 (선택)
  milestoneOrder: integer("milestone_order").default(0),
  amount: integer("amount").notNull(), // 공급가액 (원)
  taxAmount: integer("tax_amount").default(0), // 부가세
  status: text("status").notNull().default("pending"), // pending, invoiced, paid, overdue, cancelled
  dueDate: date("due_date"),
  invoicedAt: timestamp("invoiced_at"),
  paidAt: timestamp("paid_at"),
  invoiceNumber: text("invoice_number"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 활동 이력 (전체 모듈 공용) ───

export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  actorName: text("actor_name"),
  action: text("action").notNull(), // defect_created, log_submitted, billing_paid 등
  targetType: text("target_type"), // defect, daily_log, billing
  targetId: uuid("target_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 출퇴근/출역 관리 ───

export const attendance = pgTable("attendance", {
  id: uuid("id").defaultRandom().primaryKey(),
  siteId: uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  workspaceId: uuid("workspace_id").references(() => workspaces.id),
  memberId: uuid("member_id").references(() => workers.id),
  memberName: text("member_name").notNull(),
  role: text("role").notNull(), // 목수, 전기, 설비, 타일, 도배 등
  workDate: date("work_date").notNull(),
  checkIn: text("check_in"), // "08:30" HH:mm
  checkOut: text("check_out"), // "17:30" HH:mm
  hoursWorked: real("hours_worked"),
  overtimeHours: real("overtime_hours").default(0),
  status: text("status").notNull().default("present"), // present, absent, half_day, holiday
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
} from "drizzle-orm/pg-core";

// ─── Better Auth 테이블 ───

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  phone: text("phone"),
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

// ─── 고객 관리 ───

export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  memo: text("memo"),
  status: text("status").default("상담중"), // 상담중, 계약완료, 시공중, 시공완료, A/S, VIP
  referredBy: uuid("referred_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 현장 관리 ───

export const sites = pgTable("sites", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  customerId: uuid("customer_id").references(() => customers.id),
  name: text("name").notNull(),
  address: text("address"),
  buildingType: text("building_type"), // 아파트, 빌라, 오피스텔, 상가, 주택
  areaPyeong: real("area_pyeong"),
  status: text("status").notNull().default("상담중"), // 상담중, 견적중, 계약완료, 시공중, 시공완료, A/S
  startDate: date("start_date"),
  endDate: date("end_date"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 견적 관리 ───

export const estimates = pgTable("estimates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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
  siteId: uuid("site_id").references(() => sites.id),
  estimateId: uuid("estimate_id").references(() => estimates.id),
  contractAmount: integer("contract_amount").notNull(),
  contractDate: date("contract_date"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  name: text("name").notNull(),
  phone: text("phone"),
  trade: text("trade").notNull(), // 직종 (목수, 전기, 설비 등)
  dailyWage: integer("daily_wage"),
  memo: text("memo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
});

export const materialOrders = pgTable("material_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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
});

export const inventory = pgTable("inventory", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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
  plan: text("plan").notNull().default("free"),
  billingCycle: text("billing_cycle").default("monthly"),
  status: text("status").notNull().default("active"),
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
  feature: text("feature").notNull(),
  period: text("period").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 쓰레드 마케팅 자동화 ───

export const threadsAccount = pgTable("threads_account", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
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
  source: text("source").notNull(), // naver_cafe
  keyword: text("keyword").notNull(),
  postsScanned: integer("posts_scanned").default(0),
  leadsFound: integer("leads_found").default(0),
  status: text("status").notNull().default("running"), // running, completed, failed
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// ╔═══════════════════════════════════════════════════════════════╗
// ║  마케팅 센터 (Admin Marketing OS)                              ║
// ╚═══════════════════════════════════════════════════════════════╝

// ─── 마케팅 이벤트 ───
export const mktEvents = pgTable("mkt_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id),
  sessionId: text("session_id"),
  anonymousId: text("anonymous_id"),
  eventType: text("event_type").notNull(),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  // UTM 파라미터
  source: text("source"),
  medium: text("medium"),
  campaign: text("campaign"),
  content: text("content"),
  term: text("term"),
  // 컨텍스트
  landingPath: text("landing_path"),
  deviceType: text("device_type"),     // desktop, mobile, tablet
  region: text("region"),
  experimentVariant: text("experiment_variant"),
  // 추가 데이터 (이벤트별 메타)
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 마케팅 세션 ───
export const mktSessions = pgTable("mkt_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: text("user_id").references(() => user.id),
  anonymousId: text("anonymous_id"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  // 유입 정보
  source: text("source"),
  medium: text("medium"),
  campaign: text("campaign"),
  landingPath: text("landing_path"),
  deviceType: text("device_type"),
  region: text("region"),
  // 세션 요약
  pageViews: integer("page_views").default(0),
  eventCount: integer("event_count").default(0),
  maxFunnelStage: text("max_funnel_stage"),  // 도달한 최대 퍼널 단계
});

// ─── 마케팅 리드 ───
export const mktLeads = pgTable("mkt_leads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").references(() => user.id).unique(),
  email: text("email"),
  name: text("name"),
  phone: text("phone"),
  // 상태
  status: text("status").notNull().default("anonymous"),  // anonymous, identified, engaged, qualified, customer, churned
  leadScore: integer("lead_score").notNull().default(0),
  // 유입 정보 (최초)
  firstSource: text("first_source"),
  firstMedium: text("first_medium"),
  firstCampaign: text("first_campaign"),
  firstLandingPath: text("first_landing_path"),
  // 마지막 활동
  lastEvent: text("last_event"),
  lastEventAt: timestamp("last_event_at"),
  lastActiveAt: timestamp("last_active_at"),
  // 현재 세그먼트
  currentSegment: text("current_segment"),
  // 퍼널 진행 상태
  hasSignedUp: boolean("has_signed_up").default(false),
  hasUploaded: boolean("has_uploaded").default(false),
  hasSubmitted: boolean("has_submitted").default(false),
  hasAnalyzed: boolean("has_analyzed").default(false),
  hasPaid: boolean("has_paid").default(false),
  hasViewedReport: boolean("has_viewed_report").default(false),
  hasInquired: boolean("has_inquired").default(false),
  // 태그
  tags: jsonb("tags"),  // string[]
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 마케팅 세그먼트 ───
export const mktSegments = pgTable("mkt_segments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  // 규칙: { logic: "and"|"or", rules: [{ field, operator, value }] }
  rules: jsonb("rules").notNull(),
  // 동적 카운트 (마지막 계산)
  memberCount: integer("member_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  isSystem: boolean("is_system").default(false),  // 시스템 기본 세그먼트
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 마케팅 캠페인 (Admin) ───
export const mktAdminCampaigns = pgTable("mkt_admin_campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  goal: text("goal"),                   // 캠페인 목표
  channel: text("channel").notNull(),   // email, kakao, search_ads, retargeting, content
  status: text("status").notNull().default("draft"),  // draft, pending_approval, active, paused, completed
  // 예산·일정
  budget: integer("budget").default(0),
  spent: integer("spent").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  // UTM
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  // 대상 세그먼트
  targetSegmentId: uuid("target_segment_id").references(() => mktSegments.id),
  // KPI
  kpiMetric: text("kpi_metric"),       // 추적할 주요 지표
  kpiTarget: integer("kpi_target"),     // 목표 수치
  kpiCurrent: integer("kpi_current").default(0),
  // 성과
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  signups: integer("signups").default(0),
  payments: integer("payments").default(0),
  revenue: integer("revenue").default(0),
  metadata: jsonb("metadata"),
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 캠페인 에셋 ───
export const mktCampaignAssets = pgTable("mkt_campaign_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => mktAdminCampaigns.id, { onDelete: "cascade" }),
  type: text("type").notNull(),       // headline, cta, email_subject, email_body, kakao_message, blog_draft, landing_copy, review_request
  name: text("name").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 마케팅 자동화 ───
export const mktAutomations = pgTable("mkt_automations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"),  // draft, active, paused, archived
  // 트리거
  triggerEvent: text("trigger_event"),     // 시작 이벤트
  triggerSegmentId: uuid("trigger_segment_id").references(() => mktSegments.id),
  // 안전장치: { noNightSend, excludeRecentPayers, maxSendPerDay, dedupeWindow, preventReentry }
  safeguards: jsonb("safeguards"),
  // 성과
  totalEntered: integer("total_entered").default(0),
  totalCompleted: integer("total_completed").default(0),
  totalConverted: integer("total_converted").default(0),
  isSystem: boolean("is_system").default(false),  // 시스템 기본 자동화
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 자동화 단계 ───
export const mktAutomationSteps = pgTable("mkt_automation_steps", {
  id: uuid("id").defaultRandom().primaryKey(),
  automationId: uuid("automation_id").notNull().references(() => mktAutomations.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
  type: text("type").notNull(),         // trigger, condition, delay, action
  // 설정: AutomationStepConfig 타입
  config: jsonb("config").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 발송 메시지 ───
export const mktMessages = pgTable("mkt_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  leadId: uuid("lead_id").references(() => mktLeads.id),
  automationId: uuid("automation_id").references(() => mktAutomations.id),
  campaignId: uuid("campaign_id").references(() => mktAdminCampaigns.id),
  channel: text("channel").notNull(),   // email, kakao, push
  subject: text("subject"),
  content: text("content"),
  status: text("status").notNull().default("queued"),  // queued, sent, delivered, opened, clicked, bounced, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── A/B 실험 ───
export const mktExperiments = pgTable("mkt_experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  targetElement: text("target_element"),   // headline, cta, price_copy, review_block
  status: text("status").notNull().default("draft"),  // draft, running, completed
  // 주요 지표
  primaryMetric: text("primary_metric"),   // click_rate, upload_start_rate, checkout_rate, payment_rate
  // 기간
  startDate: date("start_date"),
  endDate: date("end_date"),
  // 트래픽 분배 (%)
  trafficPercent: integer("traffic_percent").default(100),
  winnerVariantId: uuid("winner_variant_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── 실험 변형 ───
export const mktExperimentVariants = pgTable("mkt_experiment_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id").notNull().references(() => mktExperiments.id, { onDelete: "cascade" }),
  name: text("name").notNull(),          // "A", "B", "C" 등
  description: text("description"),
  content: jsonb("content"),             // 변형 내용 (JSON)
  trafficWeight: integer("traffic_weight").default(50),  // 트래픽 분배 비율
  // 성과 데이터
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  conversionRate: real("conversion_rate").default(0),
  isControl: boolean("is_control").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── 일별 집계 메트릭 ───
export const mktDailyMetrics = pgTable("mkt_daily_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  // 퍼널 수치
  visits: integer("visits").default(0),
  signups: integer("signups").default(0),
  logins: integer("logins").default(0),
  uploadStarts: integer("upload_starts").default(0),
  uploadSubmits: integer("upload_submits").default(0),
  analysisCompleted: integer("analysis_completed").default(0),
  checkoutStarts: integer("checkout_starts").default(0),
  paymentSucceeded: integer("payment_succeeded").default(0),
  paymentFailed: integer("payment_failed").default(0),
  reportViews: integer("report_views").default(0),
  inquiries: integer("inquiries").default(0),
  // 매출
  revenue: integer("revenue").default(0),
  // 채널별 (JSON)
  byChannel: jsonb("by_channel"),
  byCampaign: jsonb("by_campaign"),
  byDevice: jsonb("by_device"),
  byRegion: jsonb("by_region"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

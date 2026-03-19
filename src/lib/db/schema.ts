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

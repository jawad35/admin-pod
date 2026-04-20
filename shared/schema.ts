import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash").notNull(),
  // Enhanced fields
  role: varchar("role", { length: 20 }).notNull().default("cashier"),
  shopId: varchar("shop_id").references(() => shops.id),
  mobileNo: varchar("mobile_no", { length: 20 }),
  address: text("address"),
  agreeTerms: boolean("agree_terms").default(false),
  signedAgreementUrl: varchar("signed_agreement_url", { length: 500 }),
  isPermanent: boolean("is_permanent").default(false),
  referralCount: integer("referral_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// In shared/schema.ts
// export const subscriptionPlans = pgTable("subscription_plans", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   name: varchar("name").notNull(),
//   description: text("description"),
//   price: decimal("price", { precision: 10, scale: 2 }).notNull(),
//   durationDays: integer("duration_days").notNull(),
//   features: jsonb("features"),
//   isActive: boolean("is_active").default(true),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // userId: varchar("user_id").notNull().references(() => users.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  shopId: varchar("shop_id").references(() => shops.id),
  // amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status").notNull().default("pending"),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  // discount: decimal("discount", { precision: 10, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});


// Shop types enum
export const shopTypeEnum = pgEnum("shop_type", ["retailer", "salon"]);

// Subscription status enum
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "suspended",
]);

// Plan type enum
export const planTypeEnum = pgEnum("plan_type", [
  "monthly",
  "yearly",
  "permanent",
]);

// Complaint status enum
export const complaintStatusEnum = pgEnum("complaint_status", [
  "active",
  "resolved",
  "pending",
]);

// Maintenance status enum
export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "open",
  "in_progress",
  "done",
]);

// Shops table
// export const shops = pgTable("shops", {
//   id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
//   shopId: varchar("shop_id").notNull().unique(),
//   name: varchar("name").notNull(),
//   owner: varchar("owner").notNull(),
//   type: shopTypeEnum("type").notNull(),
//   city: varchar("city").notNull(),
//   location: text("location").notNull(),
//   imageUrl: varchar("image_url"),
//   subscriptionStatus: subscriptionStatusEnum("subscription_status")
//     .notNull()
//     .default("active"),
//   monthlyFee: decimal("monthly_fee", { precision: 10, scale: 2 }).notNull(),
//   discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
//   permanentLicense: boolean("permanent_license").default(false),
//   expiryDate: timestamp("expiry_date"),

//   storageUsed: decimal("storage_used", { precision: 10, scale: 2 }).default(
//     "0",
//   ),
//   storageLimit: decimal("storage_limit", { precision: 10, scale: 2 }).default(
//     "1000",
//   ),
//   totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default(
//     "0",
//   ),
//   createdAt: timestamp("created_at").defaultNow(),
//   updatedAt: timestamp("updated_at").defaultNow(),
// });

// In shared/schema.ts
export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  license_key: varchar("license_key").unique().notNull(),
  shop_id: varchar("shop_id").notNull(),
  admin_pin: varchar("admin_pin").notNull().default('0000'), // Add default
  hardware_id: varchar("hardware_id"),
  plan_type: varchar("plan_type").notNull(),
  duration_days: integer("duration_days"),
  status: varchar("status").default("inactive"),
  activated_at: timestamp("activated_at"),
  expires_at: timestamp("expires_at"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  age: integer("age").notNull(),
  cnic: varchar("cnic").notNull().unique(),
  education: varchar("education").notNull(),
  address: text("address").notNull(),
  vehicleNo: varchar("vehicle_no"),
  assignedArea: varchar("assigned_area").notNull(),
  salary: decimal("salary", { precision: 10, scale: 2 }).notNull(),
  expenses: decimal("expenses", { precision: 10, scale: 2 }).default("0"),
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).default("0"),
  shopsAssigned: integer("shops_assigned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscriptions table
// shared/db/schema.ts

// Shops table
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").notNull().unique(),
  name: varchar("name").notNull(),
  owner: varchar("owner").notNull(),
  type: shopTypeEnum("type").notNull(),
  city: varchar("city").notNull(),
  location: text("location").notNull(),
  imageUrl: varchar("image_url"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("active"),
  subscriptionPlanId: varchar("subscription_plan_id").references(() => subscriptionPlans.id), // Link to subscription plan
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  permanentLicense: boolean("permanent_license").default(false),
  expiryDate: timestamp("expiry_date"),
  storageUsed: decimal("storage_used", { precision: 10, scale: 2 }).default("0"),
  storageLimit: decimal("storage_limit", { precision: 10, scale: 2 }).default("1000"),
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).default("0"),
  referral: varchar("referral"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Subscription Plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Basic", "Pro", "Premium"
  planType: planTypeEnum("plan_type").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // Duration in months
  features: jsonb("features").default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payment History table
export const paymentHistory = pgTable("payment_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id")
    .notNull()
    .references(() => shops.id),
  subscriptionId: varchar("subscription_id").references(() => subscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMonth: timestamp("payment_month").notNull(), // The month this payment is for
  paymentDate: timestamp("payment_date").defaultNow(),
  paymentMethod: varchar("payment_method"), // cash, card, bank_transfer
  status: varchar("status").default("paid"), // paid, pending, failed
  receiptNumber: varchar("receipt_number"),
  notes: text("notes"),
  collectedBy: varchar("collected_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscriptions table (for tracking subscription periods)
export const subscriptions = pgTable("subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id")
    .notNull()
    .references(() => shops.id),
  subscriptionPlanId: varchar("subscription_plan_id").references(() => subscriptionPlans.id),
  planType: planTypeEnum("plan_type").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  referralDiscount: boolean("referral_discount").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Office expenses table
export const expenses = pgTable("expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  category: varchar("category").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Complaints table
export const complaints = pgTable("complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id")
    .notNull()
    .references(() => shops.id),
  employeeId: varchar("employee_id").references(() => employees.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: complaintStatusEnum("status").notNull().default("pending"),
  priority: varchar("priority").notNull().default("medium"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Maintenance tasks table
export const maintenance = pgTable("maintenance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  status: maintenanceStatusEnum("status").notNull().default("open"),
  assignedTo: varchar("assigned_to").references(() => employees.id),
  shopId: varchar("shop_id").references(() => shops.id),
  priority: varchar("priority").notNull().default("medium"),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerShopId: varchar("referrer_shop_id")
    .notNull()
    .references(() => shops.id),
  referredShopId: varchar("referred_shop_id")
    .notNull()
    .references(() => shops.id),
  discountAmount: decimal("discount_amount", {
    precision: 10,
    scale: 2,
  }).notNull(),
  discountPercentage: decimal("discount_percentage", {
    precision: 5,
    scale: 2,
  }).default("20"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  action: varchar("action").notNull(),
  entity: varchar("entity").notNull(),
  entityId: varchar("entity_id").notNull(),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow(),
});


export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profileImageUrl: z.string().url("Invalid URL").optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Enhanced registration schema
export const shopUsersSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(['super_admin', 'admin', 'cashier', 'user']).default('user'),
  shopId: z.string().optional(),
  mobileNo: z.string().min(1, "Mobile number is required"),
  address: z.string().min(1, "Address is required"),
  agreeTerms: z.boolean().refine(val => val === true, "You must agree to terms and policies"),
  signedAgreementUrl: z.string().optional(),
  isPermanent: z.boolean().default(false),
  planId: z.string().optional(), // Changed from number to string
  referrerId: z.string().optional(), // Changed from number to string
});

export type LoginInput = z.infer<typeof loginSchema>;

// Insert schemas


export const insertShopSchema = createInsertSchema(shops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses, {
  amount: z.preprocess(
    (val) => (val !== undefined && val !== null ? String(val) : undefined),
    z.string()
  ),
  date: z.preprocess(
    (val) => (val ? new Date(val as string) : undefined),
    z.date()
  ),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export const insertComplaintSchema = createInsertSchema(complaints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// Types

// Types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;
export type SafeShop = Omit<Shop, "password">;

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;

export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaints.$inferSelect;

export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenance.$inferSelect;

export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

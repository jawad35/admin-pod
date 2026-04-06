import {
  users,
  shops,
  employees,
  subscriptions,
  expenses,
  complaints,
  maintenance,
  referrals,
  auditLogs,
  type User,
  type UpsertUser,
  type Shop,
  type InsertShop,
  type Employee,
  type InsertEmployee,
  type Subscription,
  type InsertSubscription,
  type Expense,
  type InsertExpense,
  type Complaint,
  type InsertComplaint,
  type Maintenance,
  type InsertMaintenance,
  type Referral,
  type InsertReferral,
  type AuditLog,
  type InsertAuditLog,
  SafeShop,
  UserSubscription,
  SubscriptionPlan,
  InsertSubscriptionPlan,
  InsertUserSubscription,
  userSubscriptions,
  subscriptionPlans,
  licenses,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  getLicenseByKey(licenseKey: string): Promise<any>;
  createLicense(licenseData: any): Promise<any>;
  updateLicense(licenseKey: string, data: any): Promise<any>;
  getLicensesByShopId(shopId: string): Promise<any[]>;

  // Shop operations
  getShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop>;
  deleteShop(id: string): Promise<void>;
  getExpiredShops(): Promise<Shop[]>;

  // Employee operations
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: string): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;

  // Subscription operations
  getSubscriptions(): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription>;

  // Expense operations
  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;

  // Complaint operations
  getComplaints(): Promise<Complaint[]>;
  createComplaint(complaint: InsertComplaint): Promise<Complaint>;
  updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint>;

  // Maintenance operations
  getMaintenance(): Promise<Maintenance[]>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(id: string, maintenance: Partial<InsertMaintenance>): Promise<Maintenance>;

  // Referral operations
  getReferrals(): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;

  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(): Promise<AuditLog[]>;

  // Dashboard stats
  getDashboardStats(): Promise<any>;

  // Subscription plan operations
  // In your storage interface, add:
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;

  // User subscription operations
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>;
  getShopSubscriptions(shopId: string): Promise<UserSubscription[]>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription>;
  getSubscriptionHistory(filters?: { userId?: string; shopId?: string; month?: number; year?: number }): Promise<UserSubscription[]>;
}

export class DatabaseStorage implements IStorage {

  // In DatabaseStorage class
  async getLicenseByKey(licenseKey: string): Promise<any> {
    const result = await db.select().from(licenses).where(eq(licenses.license_key, licenseKey)).limit(1);
    return result[0];
  }

  async createLicense(licenseData: any): Promise<any> {
    const result = await db.insert(licenses).values(licenseData).returning();
    return result[0];
  }

  // In storage.ts
  async updateLicense(licenseKey: string, data: any): Promise<any> {
    // Convert dates properly
    const updateData = { ...data };
    if (updateData.activated_at && !(updateData.activated_at instanceof Date)) {
      updateData.activated_at = new Date(updateData.activated_at);
    }
    if (updateData.expires_at && !(updateData.expires_at instanceof Date)) {
      updateData.expires_at = new Date(updateData.expires_at);
    }

    const result = await db.update(licenses).set(updateData).where(eq(licenses.license_key, licenseKey)).returning();
    return result[0];
  }

  async getLicensesByShopId(shopId: string): Promise<any[]> {
    return await db.select().from(licenses).where(eq(licenses.shop_id, shopId));
  }
  // User operations (required for Replit Auth)

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    passwordHash: string;
    profileImageUrl?: string;
    role?: string;
    shopId?: string;
    mobileNo?: string;
    address?: string;
    agreeTerms?: boolean;
    signedAgreementUrl?: string;
    isPermanent?: boolean;
  }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      profileImageUrl: data.profileImageUrl,
      passwordHash: data.passwordHash,
      role: data.role || 'cashier',
      shopId: data.shopId,
      mobileNo: data.mobileNo,
      address: data.address,
      agreeTerms: data.agreeTerms || false,
      signedAgreementUrl: data.signedAgreementUrl,
      isPermanent: data.isPermanent || false,
    }).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }
  async getUsersWithShops(): Promise<any[]> {
    const usersData = await db.select().from(users).orderBy(desc(users.createdAt));
    const shopsData = await db.select().from(shops);

    return usersData.map(user => ({
      ...user,
      shop: shopsData.find(shop => shop.id === user.shopId)
    }));
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Shop operations

  // In your storage file
  async getShopByEmail(email: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.email, email));
    return shop;
  }

  async getShops(): Promise<Shop[]> {
    return await db.select().from(shops).orderBy(desc(shops.createdAt));
  }
  async getShop(id: string): Promise<Shop | undefined> {
    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, id));

    return shop;
  }

  async createShop(shop: InsertShop): Promise<Shop> {
    const [newShop] = await db.insert(shops).values(shop).returning();
    return newShop;
  }

  async updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop> {
    const [updatedShop] = await db
      .update(shops)
      .set({ ...shop, updatedAt: new Date() })
      .where(eq(shops.id, id))
      .returning();
    return updatedShop;
  }

  async deleteShop(id: string): Promise<void> {
    await db.delete(shops).where(eq(shops.id, id));
  }

  async getExpiredShops(): Promise<Shop[]> {
    return await db
      .select()
      .from(shops)
      .where(eq(shops.subscriptionStatus, "expired"))
      .orderBy(desc(shops.expiryDate));
  }

  // Employee operations
  async getEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async getEmployee(id: string): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: string, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updatedEmployee] = await db
      .update(employees)
      .set({ ...employee, updatedAt: new Date() })
      .where(eq(employees.id, id))
      .returning();
    return updatedEmployee;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Subscription operations
  async getSubscriptions(): Promise<Subscription[]> {
    return await db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: string, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updatedSubscription] = await db
      .update(subscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(subscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  // Expense operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Complaint operations
  async getComplaints(): Promise<Complaint[]> {
    return await db.select().from(complaints).orderBy(desc(complaints.createdAt));
  }

  async createComplaint(complaint: InsertComplaint): Promise<Complaint> {
    const [newComplaint] = await db.insert(complaints).values(complaint).returning();
    return newComplaint;
  }

  async updateComplaint(id: string, complaint: Partial<InsertComplaint>): Promise<Complaint> {
    const [updatedComplaint] = await db
      .update(complaints)
      .set({ ...complaint, updatedAt: new Date() })
      .where(eq(complaints.id, id))
      .returning();
    return updatedComplaint;
  }

  // Maintenance operations
  async getMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).orderBy(desc(maintenance.createdAt));
  }

  async createMaintenance(maintenanceTask: InsertMaintenance): Promise<Maintenance> {
    const [newMaintenance] = await db.insert(maintenance).values(maintenanceTask).returning();
    return newMaintenance;
  }

  async updateMaintenance(id: string, maintenanceTask: Partial<InsertMaintenance>): Promise<Maintenance> {
    const [updatedMaintenance] = await db
      .update(maintenance)
      .set({ ...maintenanceTask, updatedAt: new Date() })
      .where(eq(maintenance.id, id))
      .returning();
    return updatedMaintenance;
  }

  // Referral operations
  async getReferrals(): Promise<Referral[]> {
    return await db.select().from(referrals).orderBy(desc(referrals.createdAt));
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [newReferral] = await db.insert(referrals).values(referral).returning();
    return newReferral;
  }

  // Audit log operations
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [newAuditLog] = await db.insert(auditLogs).values(auditLog).returning();
    return newAuditLog;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50);
  }

  // Dashboard stats
  async getDashboardStats(): Promise<any> {
    const [totalShops] = await db.select({ count: count() }).from(shops);
    const [activeShops] = await db
      .select({ count: count() })
      .from(shops)
      .where(eq(shops.subscriptionStatus, "active"));
    const [expiredShops] = await db
      .select({ count: count() })
      .from(shops)
      .where(eq(shops.subscriptionStatus, "expired"));
    const [totalEmployees] = await db.select({ count: count() }).from(employees);
    const [totalRevenue] = await db
      .select({ sum: sum(shops.totalRevenue) })
      .from(shops);
    const [totalExpenses] = await db
      .select({ sum: sum(expenses.amount) })
      .from(expenses);
    const [activeComplaints] = await db
      .select({ count: count() })
      .from(complaints)
      .where(eq(complaints.status, "active"));
    const [totalStorage] = await db
      .select({ sum: sum(shops.storageUsed) })
      .from(shops);

    return {
      totalShops: totalShops.count || 0,
      activeShops: activeShops.count || 0,
      expiredShops: expiredShops.count || 0,
      totalEmployees: totalEmployees.count || 0,
      totalRevenue: totalRevenue.sum || "0",
      totalExpenses: totalExpenses.sum || "0",
      activeComplaints: activeComplaints.count || 0,
      totalStorage: totalStorage.sum || "0",
      churnRate: totalShops.count ? ((expiredShops.count || 0) / totalShops.count * 100).toFixed(1) : "0",
    };
  }

  // Subscription plan operations
  // Add to your DatabaseStorage class:
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, id));
    return plan;
  }

  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db.insert(subscriptionPlans).values(plan).returning();
    return newPlan;
  }

  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set({ ...plan, updatedAt: new Date() })
      .where(eq(subscriptionPlans.id, id))
      .returning();
    return updatedPlan;
  }

  // User subscription operations
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    return await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(desc(userSubscriptions.year), desc(userSubscriptions.month));
  }

  async getShopSubscriptions(shopId: string): Promise<UserSubscription[]> {
    return await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.shopId, shopId))
      .orderBy(desc(userSubscriptions.year), desc(userSubscriptions.month));
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const [newSubscription] = await db.insert(userSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async deleteUserSubscription(id: string): Promise<void> {
    await db.delete(userSubscriptions).where(eq(userSubscriptions.id, id));
  }

  async incrementReferralCount(userId: string): Promise<void> {
    await db.update(users)
      .set({ referralCount: sql`${users.referralCount} + 1` })
      .where(eq(users.id, userId));
  }

  async updateUserSubscription(id: string, subscription: Partial<InsertUserSubscription>): Promise<UserSubscription> {
    const [updatedSubscription] = await db
      .update(userSubscriptions)
      .set({ ...subscription, updatedAt: new Date() })
      .where(eq(userSubscriptions.id, id))
      .returning();
    return updatedSubscription;
  }

  async getSubscriptionHistory(filters?: { userId?: string; shopId?: string; month?: number; year?: number }): Promise<UserSubscription[]> {
    let query = db.select().from(userSubscriptions);

    if (filters?.userId) {
      query = query.where(eq(userSubscriptions.userId, filters.userId));
    }
    if (filters?.shopId) {
      query = query.where(eq(userSubscriptions.shopId, filters.shopId));
    }
    if (filters?.month) {
      query = query.where(eq(userSubscriptions.month, filters.month));
    }
    if (filters?.year) {
      query = query.where(eq(userSubscriptions.year, filters.year));
    }

    return await query.orderBy(desc(userSubscriptions.year), desc(userSubscriptions.month));
  }
}

export const storage = new DatabaseStorage();

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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
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

  // Shop operations
  async getShops(): Promise<Shop[]> {
    return await db.select().from(shops).orderBy(desc(shops.createdAt));
  }

  async getShop(id: string): Promise<Shop | undefined> {
    const [shop] = await db.select().from(shops).where(eq(shops.id, id));
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
}

export const storage = new DatabaseStorage();

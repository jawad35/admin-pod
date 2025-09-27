import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertShopSchema,
  insertEmployeeSchema,
  insertExpenseSchema,
  insertComplaintSchema,
  insertMaintenanceSchema,
  insertSubscriptionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Shop routes
  app.get("/api/shops", isAuthenticated, async (req, res) => {
    try {
      const shops = await storage.getShops();
      res.json(shops);
    } catch (error) {
      console.error("Error fetching shops:", error);
      res.status(500).json({ message: "Failed to fetch shops" });
    }
  });

  app.get("/api/shops/expired", isAuthenticated, async (req, res) => {
    try {
      const expiredShops = await storage.getExpiredShops();
      res.json(expiredShops);
    } catch (error) {
      console.error("Error fetching expired shops:", error);
      res.status(500).json({ message: "Failed to fetch expired shops" });
    }
  });

  app.get("/api/shops/:id", isAuthenticated, async (req, res) => {
    try {
      const shop = await storage.getShop(req.params.id);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      console.error("Error fetching shop:", error);
      res.status(500).json({ message: "Failed to fetch shop" });
    }
  });

  app.post("/api/shops", isAuthenticated, async (req: any, res) => {
    try {
      const shopData = insertShopSchema.parse(req.body);
      const shop = await storage.createShop(shopData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Shop Created",
        entity: "shop",
        entityId: shop.id,
        details: `Created shop "${shop.name}" with ID ${shop.shopId}`,
      });

      res.status(201).json(shop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shop data", errors: error.errors });
      }
      console.error("Error creating shop:", error);
      res.status(500).json({ message: "Failed to create shop" });
    }
  });

  app.put("/api/shops/:id", isAuthenticated, async (req: any, res) => {
    try {
      const shopData = insertShopSchema.partial().parse(req.body);
      const shop = await storage.updateShop(req.params.id, shopData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Shop Updated",
        entity: "shop",
        entityId: shop.id,
        details: `Updated shop "${shop.name}"`,
      });

      res.json(shop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shop data", errors: error.errors });
      }
      console.error("Error updating shop:", error);
      res.status(500).json({ message: "Failed to update shop" });
    }
  });

  app.delete("/api/shops/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteShop(req.params.id);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Shop Deleted",
        entity: "shop",
        entityId: req.params.id,
        details: `Deleted shop with ID ${req.params.id}`,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting shop:", error);
      res.status(500).json({ message: "Failed to delete shop" });
    }
  });

  // Employee routes
  app.get("/api/employees", isAuthenticated, async (req, res) => {
    try {
      const employees = await storage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.post("/api/employees", isAuthenticated, async (req: any, res) => {
    try {
      const employeeData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(employeeData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Employee Added",
        entity: "employee",
        entityId: employee.id,
        details: `Added employee "${employee.name}" to ${employee.assignedArea} area`,
      });

      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error creating employee:", error);
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.put("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      const employeeData = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(req.params.id, employeeData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Employee Updated",
        entity: "employee",
        entityId: employee.id,
        details: `Updated employee "${employee.name}"`,
      });

      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid employee data", errors: error.errors });
      }
      console.error("Error updating employee:", error);
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Employee Deleted",
        entity: "employee",
        entityId: req.params.id,
        details: `Deleted employee with ID ${req.params.id}`,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", isAuthenticated, async (req, res) => {
    try {
      const subscriptions = await storage.getSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.post("/api/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const subscriptionData = insertSubscriptionSchema.parse(req.body);
      const subscription = await storage.createSubscription(subscriptionData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Subscription Created",
        entity: "subscription",
        entityId: subscription.id,
        details: `Created ${subscription.planType} subscription - ₨ ${subscription.amount}`,
      });

      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // Expense routes
  app.get("/api/expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", isAuthenticated, async (req: any, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Expense Created",
        entity: "expense",
        entityId: expense.id,
        details: `Added expense "${expense.title}" - ₨ ${expense.amount}`,
      });

      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid expense data", errors: error.errors });
      }
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  // Complaint routes
  app.get("/api/complaints", isAuthenticated, async (req, res) => {
    try {
      const complaints = await storage.getComplaints();
      res.json(complaints);
    } catch (error) {
      console.error("Error fetching complaints:", error);
      res.status(500).json({ message: "Failed to fetch complaints" });
    }
  });

  app.post("/api/complaints", isAuthenticated, async (req: any, res) => {
    try {
      const complaintData = insertComplaintSchema.parse(req.body);
      const complaint = await storage.createComplaint(complaintData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Complaint Created",
        entity: "complaint",
        entityId: complaint.id,
        details: `New complaint "${complaint.title}"`,
      });

      res.status(201).json(complaint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid complaint data", errors: error.errors });
      }
      console.error("Error creating complaint:", error);
      res.status(500).json({ message: "Failed to create complaint" });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", isAuthenticated, async (req, res) => {
    try {
      const maintenance = await storage.getMaintenance();
      res.json(maintenance);
    } catch (error) {
      console.error("Error fetching maintenance:", error);
      res.status(500).json({ message: "Failed to fetch maintenance" });
    }
  });

  app.post("/api/maintenance", isAuthenticated, async (req: any, res) => {
    try {
      const maintenanceData = insertMaintenanceSchema.parse(req.body);
      const maintenance = await storage.createMaintenance(maintenanceData);
      
      // Log audit
      await storage.createAuditLog({
        userId: req.user.claims.sub,
        action: "Maintenance Task Created",
        entity: "maintenance",
        entityId: maintenance.id,
        details: `Created maintenance task "${maintenance.title}"`,
      });

      res.status(201).json(maintenance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: error.errors });
      }
      console.error("Error creating maintenance:", error);
      res.status(500).json({ message: "Failed to create maintenance" });
    }
  });

  // Referral routes
  app.get("/api/referrals", isAuthenticated, async (req, res) => {
    try {
      const referrals = await storage.getReferrals();
      res.json(referrals);
    } catch (error) {
      console.error("Error fetching referrals:", error);
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Audit log routes
  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const auditLogs = await storage.getAuditLogs();
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

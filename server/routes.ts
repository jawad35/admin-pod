import type { Express, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

import { setupAuth, isAuthenticated } from "./replitAuth";
import {
  insertShopSchema,
  insertEmployeeSchema,
  insertExpenseSchema,
  insertComplaintSchema,
  insertMaintenanceSchema,
  insertSubscriptionSchema,
  loginSchema,
  registerSchema,
  shopUsersSchema,
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  // app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
  //   try {
  //     const userId = req.user.id;
  //     const user = await storage.getUser(userId);
  //     res.json(user);
  //   } catch (error) {
  //     console.error("Error fetching user:", error);
  //     res.status(500).json({ message: "Failed to fetch user" });
  //   }
  // });

  // --- Login route ---
  app.post("/api/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) return res.status(404).json({ message: "User not found" });

      const isValid = await bcrypt.compare(data.password, user.passwordHash);
      if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      res.json({ user, token });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(400).json({ message: err.message });
    }
  });

  // --- Register route ---
  app.post("/api/register", async (req, res) => {
    try {
      console.log(req.body)
      const data = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(data.email);
      if (existing) return res.status(400).json({ message: "Email already in use" });

      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({
        ...data,
        passwordHash,
      });

      res.status(201).json(user);
    } catch (err: any) {
      console.error("Register error:", err);
      res.status(400).json({ message: err.message });
    }
  });

  // shop users
  app.post("/api/register-shop-users", async (req, res) => {
    try {
      console.log("Registration shop user data:", req.body);

      const data = shopUsersSchema.parse(req.body);

      // Check if email already exists
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await storage.createUser({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash,
        role: data.role,
        shopId: data.shopId,
        mobileNo: data.mobileNo,
        address: data.address,
        agreeTerms: data.agreeTerms,
        signedAgreementUrl: data.signedAgreementUrl,
        isPermanent: data.isPermanent,
      });

      // Create subscription if plan is selected AND user is not permanent
      if (data.planId && !data.isPermanent) {
        const plan = await storage.getSubscriptionPlan(data.planId);
        if (plan) {
          const currentDate = new Date();
          await storage.createUserSubscription({
            userId: user.id,
            planId: data.planId,
            shopId: data.shopId,
            amount: plan.price,
            status: 'paid',
            month: currentDate.getMonth() + 1,
            year: currentDate.getFullYear(),
            discount: "0",
            notes: `Initial subscription - ${plan.name}`
          });
        }
      }

      // Handle referral
      // Simply remove this block from your registration:
      // Handle referral
      // if (data.referrerId) {
      //   await storage.createReferral({
      //     referrerId: data.referrerId,
      //     referredEmail: data.email,
      //     referredName: `${data.firstName} ${data.lastName}`
      //   });

      //   // Increment referrer's referral count
      //   await storage.incrementReferralCount(data.referrerId);
      // }

      // Log registration
      await storage.createAuditLog({
        userId: user.id,
        action: "User Registered",
        entity: "user",
        entityId: user.id,
        details: `User ${data.email} registered with role ${data.role}`,
      });

      res.status(201).json({
        ...user,
        passwordHash: undefined // Remove password hash from response
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: err.errors
        });
      }
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getUsersWithShops();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  // Add to your routes
  app.get("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Handle password update if provided
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }

      const user = await storage.updateUser(req.params.id, updateData);
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  // Subscription Plans
  // Make sure your API routes use the correct methods:
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans(); // This should work now
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
    }
  });

  app.post("/api/subscription-plans", isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.createSubscriptionPlan(req.body);
      res.status(201).json(plan);
    } catch (error) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ message: "Failed to create subscription plan" });
    }
  });

  app.put("/api/subscription-plans/:id", isAuthenticated, async (req: any, res) => {
    try {
      const plan = await storage.updateSubscriptionPlan(req.params.id, req.body);
      res.json(plan);
    } catch (error) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ message: "Failed to update subscription plan" });
    }
  });
  // User Subscriptions
  app.get("/api/users/:userId/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const subscriptions = await storage.getUserSubscriptions(req.params.userId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user subscriptions" });
    }
  });

  app.get("/api/shops/:shopId/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const subscriptions = await storage.getShopSubscriptions(req.params.shopId);
      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch shop subscriptions" });
    }
  });

  app.post("/api/shops/:shopId/subscriptions", isAuthenticated, async (req: any, res) => {
    try {
      const { shopId } = req.params;

      const subscription = await storage.createUserSubscription({
        ...req.body,
        shopId: shopId,
        // Remove userId completely since it's not in schema
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  // DELETE /api/subscriptions/:id
  app.delete("/api/subscriptions/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteUserSubscription(req.params.id);
      res.json({ message: "Subscription deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subscription" });
    }
  });

  // PUT /api/subscriptions/:id
  app.put("/api/subscriptions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const subscription = await storage.updateUserSubscription(req.params.id, req.body);
      res.json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  // app.put("/api/user-subscriptions/:id", isAuthenticated, async (req: any, res) => {
  //   try {
  //     const subscription = await storage.updateUserSubscription(req.params.id, req.body);
  //     res.json(subscription);
  //   } catch (error) {
  //     res.status(500).json({ message: "Failed to update subscription" });
  //   }
  // });

  // Subscription History with filters
  app.get("/api/subscription-history", isAuthenticated, async (req: any, res) => {
    try {
      const { userId, shopId, month, year } = req.query;
      const filters = {
        userId,
        shopId,
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
      };

      const history = await storage.getSubscriptionHistory(filters);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription history" });
    }
  });

  // Mark current month subscription
  app.post("/api/users/:userId/mark-subscription", isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { planId, amount, discount = 0, notes, shopId } = req.body;

      const user = await storage.getUser(userId);
      if (user?.isPermanent) {
        return res.status(400).json({ message: "Permanent users don't require subscriptions" });
      }

      const currentDate = new Date();
      const subscription = await storage.createUserSubscription({
        userId,
        planId,
        shopId: shopId || user?.shopId,
        amount,
        status: 'paid',
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        discount,
        notes: notes || `Monthly subscription for ${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`
      });

      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark subscription" });
    }
  });

  // Additional API routes
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      res.status(500).json({ message: "Failed to fetch subscription plans" });
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

  app.post("/api/shop-login", async (req, res) => {
    try {
      const { email, password } = req.body;

      console.log(req.body)

      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found with this email" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Compare passwords (using passwordHash since you're storing hashed passwords)
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Get shop data if user has a shopId
      let shopData = null;
      if (user.shopId) {
        shopData = await storage.getShop(user.shopId);
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          shopId: user.shopId,
          role: user.role,
          type: "user"
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      // Return user details (excluding passwordHash) and shop data
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        user: userWithoutPassword,
        shop: shopData, // Include shop data
        token
      });

    } catch (err: any) {
      console.error("Shop login error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

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
      console.log("Received data:", req.body);

      // Ensure expiryDate is a proper Date object and not null
      const shopData = { ...req.body };

      if (!shopData.expiryDate || !(shopData.expiryDate instanceof Date)) {
        // Provide a default date if not provided or invalid
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() + 1); // 1 year from now
        shopData.expiryDate = defaultDate;
      }

      // Ensure it's a proper Date instance that Drizzle can handle
      if (shopData.expiryDate && !(shopData.expiryDate instanceof Date)) {
        shopData.expiryDate = new Date(shopData.expiryDate);
      }

      console.log("Processed data for DB:", shopData);

      const shop = await storage.createShop(shopData);

      // Log audit
      await storage.createAuditLog({
        userId: req.user.id,
        action: "Shop Created",
        entity: "shop",
        entityId: shop.id,
        details: `Created shop "${shop.name}" with ID ${shop.shopId}`,
      });

      res.status(201).json(shop);
    } catch (error) {
      console.error("Error creating shop:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid shop data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create shop" });
    }
  });

  const safeShopSchema = insertShopSchema
    .partial()
    .extend({
      expiryDate: z.preprocess(
        (val) => {
          if (typeof val === "string" && !isNaN(Date.parse(val))) {
            return new Date(val);
          }
          return val; // leave as is if already Date or undefined
        },
        z.date().optional()
      ),
    });

  app.put("/api/shops/:id", isAuthenticated, async (req: any, res) => {
    try {
      console.log("data", req.body);

      // ✅ Parse with safe schema
      const shopData = safeShopSchema.parse(req.body);

      const shop = await storage.updateShop(req.params.id, shopData);

      // ✅ Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: "Shop Updated",
        entity: "shop",
        entityId: shop.id,
        details: `Updated shop "${shop.name}"`,
      });

      res.json(shop);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid shop data", errors: error.errors });
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
        userId: req.user.id,
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
        userId: req.user.id,
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
        userId: req.user.id,
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
        userId: req.user.id,
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
        userId: req.user.id,
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
  app.get("/api/expenses", async (req, res) => {
    console.log('exp123')
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      console.log("Incoming body:", req.body);

      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);

      res.status(201).json(expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation errors:", JSON.stringify(error.errors, null, 2));
        return res
          .status(400)
          .json({ message: "Invalid expense data", errors: error.errors });
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
        userId: req.user.id,
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
        userId: req.user.id,
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

  // In your server/index.ts - update the license activation endpoint
  // In your server/index.ts
  // In your server/index.ts
  // Store activated licenses in memory (for testing)

  // Admin endpoint to generate license key for a shop
  app.post("/api/admin/generate-license", isAuthenticated, async (req: any, res) => {
    try {
      const { shopId, planType, durationDays } = req.body;

      // Check if user is admin
      // if (req.user.role !== 'admin') {
      //   return res.status(403).json({ message: "Unauthorized" });
      // }

      // Get shop details
      const shop = await storage.getShop(shopId);
      if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
      }

      // Generate unique license key
      const licenseKey = `POS-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-6)}`;

      // Calculate expiry date
      let expiresAt = null;
      if (planType === 'test') {
        // 30 seconds from now
        expiresAt = new Date(Date.now() + 30 * 1000);
      } else if (planType !== 'lifetime' && durationDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);
      }

      const license = await storage.createLicense({
        license_key: licenseKey,
        shop_id: shopId,
        plan_type: planType,
        duration_days: durationDays,
        status: 'inactive',
        expires_at: expiresAt
      });

      res.json({
        success: true,
        license: {
          key: license.license_key,
          plan_type: license.plan_type,
          duration_days: license.duration_days,
          expires_at: license.expires_at,
          shop: {
            name: shop.name,
            owner: shop.owner,
            shopId: shop.shopId
          }
        }
      });
    } catch (error) {
      console.error("Error generating license:", error);
      res.status(500).json({ message: "Failed to generate license" });
    }
  });

  // Get license status endpoint
  app.get("/api/license/status/:licenseKey", async (req, res) => {
    try {
      const { licenseKey } = req.params;
      const license = await storage.getLicenseByKey(licenseKey);

      if (!license) {
        return res.json({ success: false, message: "License not found" });
      }

      const shop = await storage.getShop(license.shop_id);

      res.json({
        success: true,
        license: {
          key: license.license_key,
          status: license.status,
          plan_type: license.plan_type,
          expires_at: license.expires_at,
          activated_at: license.activated_at
        },
        shop
      });
    } catch (error) {
      console.error("Error checking license:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });


  const activatedLicenses = new Map();

  // In your server/index.ts - Update license activation endpoint
  app.post('/api/license/activate', async (req, res) => {
    try {
      const { license_key, hardware_id, shop_name, app_version } = req.body;

      // Get license from database
      const license = await storage.getLicenseByKey(license_key);

      if (!license) {
        return res.json({ success: false, message: 'Invalid license key' });
      }

      // Check if already activated on another device
      if (license.hardware_id && license.hardware_id !== hardware_id) {
        return res.json({ success: false, message: 'License already activated on another computer' });
      }

      // Check if expired - handle null expires_at (lifetime license)
      if (license.expires_at) {
        const expiresAt = new Date(license.expires_at);
        if (expiresAt < new Date()) {
          return res.json({ success: false, message: 'License has expired' });
        }
      }

      // Get shop details
      const shop = await storage.getShop(license.shop_id);

      if (!shop) {
        return res.json({ success: false, message: 'Shop not found' });
      }

      // Update license with hardware_id
      await storage.updateLicense(license_key, {
        hardware_id: hardware_id,
        activated_at: new Date(),
        status: 'active'
      });

      // Calculate expiry date for response - handle properly
      let expiryDateForResponse = null;
      if (license.expires_at) {
        // If expires_at exists, use it
        expiryDateForResponse = new Date(license.expires_at);
      } else if (license.duration_days) {
        // Calculate based on duration days
        const calculatedExpiry = new Date();
        calculatedExpiry.setDate(calculatedExpiry.getDate() + license.duration_days);
        expiryDateForResponse = calculatedExpiry;
      }

      res.json({
        success: true,
        expiry_date: expiryDateForResponse ? expiryDateForResponse.toISOString() : null,
        plan_type: license.plan_type,
        shop: {
          id: shop.id,
          shopId: shop.shopId,
          name: shop.name,
          owner: shop.owner,
          type: shop.type,
          city: shop.city,
          location: shop.location,
          imageUrl: shop.imageUrl,
          subscriptionStatus: shop.subscriptionStatus,
          monthlyFee: shop.monthlyFee,
          discount: shop.discount,
          permanentLicense: shop.permanentLicense,
          expiryDate: shop.expiryDate,
          createdAt: shop.createdAt
        },
        message: 'License activated successfully'
      });
    } catch (error) {
      console.error('Activation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // Get licenses for a shop
  app.get("/api/licenses/shop/:shopId", isAuthenticated, async (req: any, res) => {
    try {
      const { shopId } = req.params;
      const licenses = await storage.getLicensesByShopId(shopId);
      res.json(licenses);
    } catch (error) {
      console.error("Error fetching licenses:", error);
      res.status(500).json({ message: "Failed to fetch licenses" });
    }
  });

  // Get license details by key (for verification)
  app.get("/api/license/:licenseKey", async (req, res) => {
    try {
      const { licenseKey } = req.params;
      const license = await storage.getLicenseByKey(licenseKey);

      if (!license) {
        return res.status(404).json({ message: "License not found" });
      }

      const shop = await storage.getShop(license.shop_id);

      res.json({
        license: {
          key: license.license_key,
          status: license.status,
          plan_type: license.plan_type,
          expires_at: license.expires_at,
          activated_at: license.activated_at,
          hardware_id: license.hardware_id
        },
        shop: {
          name: shop?.name,
          owner: shop?.owner,
          shopId: shop?.shopId
        }
      });
    } catch (error) {
      console.error("Error fetching license:", error);
      res.status(500).json({ message: "Failed to fetch license" });
    }
  });

  app.post('/api/license/verify', async (req, res) => {
    try {
      const { license_key, hardware_id } = req.body;

      console.log('License verification request:', { license_key, hardware_id });

      // Get the stored license data
      const license = activatedLicenses.get(license_key);

      if (!license) {
        return res.json({
          success: false,
          message: 'License not found'
        });
      }

      // Return the ORIGINAL expiry date, not a new one
      res.json({
        success: true,
        expiry_date: license.expiry_date  // Return stored expiry date
      });
    } catch (error) {
      console.error('Verification error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

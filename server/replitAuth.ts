// server/auth.ts
import { Express, RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import "dotenv/config"; // <-- loads .env automatically

export function setupAuth(app: Express) {

  // --- Get logged-in user ---
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    console.log('alling')
    try {
      res.json(req.user);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // --- Logout (just client-side delete token) ---
  app.get("/api/logout", (req, res) => {
    res.json({ message: "Logged out. Please delete token on client." });
  });
}

// Middleware: check JWT token
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Unauthorized" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

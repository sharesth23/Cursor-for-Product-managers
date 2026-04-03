import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";
import { verifyToken, requireRole, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: "Too many attempts, try again in 15 minutes" },
});

// Helper to log auth actions
async function logAuthAction(db, companyId, employeeId, action, req) {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const ua = req.headers["user-agent"] || "";
    await db.run(
      `INSERT INTO auth_logs (id, company_id, employee_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
      [uuid(), companyId, employeeId, action, ip, ua]
    );
  } catch (err) {
    console.error("Failed to log auth action", err);
  }
}

// 1. Employee Login
router.post("/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = getDB();
  try {
    const employee = await db.get("SELECT * FROM employees WHERE email = ?", email.toLowerCase());
    if (!employee) {
      // Don't leak exact reason to prevent enumeration, but wait, the prompt says return specific errors
      // Actually prompt says "Invalid email or password" for bad creds
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const company = await db.get("SELECT * FROM companies WHERE id = ?", employee.company_id);
    if (!company) return res.status(401).json({ error: "Company not found" });

    if (!company.is_active) {
      logAuthAction(db, company.id, employee.id, "login_failed_company_inactive", req);
      return res.status(403).json({ error: "Company account is inactive. Contact your administrator." });
    }

    if (company.expires_at && new Date(company.expires_at) < new Date()) {
      logAuthAction(db, company.id, employee.id, "login_failed_license_expired", req);
      return res.status(403).json({ error: "License expired. Contact your company admin." });
    }

    if (!employee.is_active) {
      logAuthAction(db, company.id, employee.id, "login_failed_user_inactive", req);
      return res.status(403).json({ error: "Your account has been deactivated. Contact your company admin." });
    }

    const match = await bcrypt.compare(password, employee.password_hash);
    if (!match) {
      logAuthAction(db, company.id, employee.id, "login_failed_wrong_password", req);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        sub: employee.id,
        company_id: company.id,
        company_slug: company.slug,
        role: employee.role,
        plan: company.plan
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await db.run("UPDATE employees SET last_login_at = ? WHERE id = ?", [new Date().toISOString(), employee.id]);
    await logAuthAction(db, company.id, employee.id, "login_success", req);

    res.json({ token, role: employee.role, companySlug: company.slug });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed due to server error" });
  }
});

// 2. Super Admin Login
router.post("/super-admin/login", loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = getDB();
  try {
    const admin = await db.get("SELECT * FROM super_admins WHERE email = ?", email.toLowerCase());
    if (!admin) return res.status(401).json({ error: "Invalid email or password" });

    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { sub: admin.id, role: "super_admin" },
      process.env.SUPER_ADMIN_JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, role: "super_admin" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. Signup for new companies
router.post("/signup", async (req, res) => {
  const { companyName, userName, email, password } = req.body;
  if (!companyName || !userName || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const db = getDB();
  try {
    // Generate a basic slug
    let slug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Check if slug taken
    const existingCompany = await db.get("SELECT id FROM companies WHERE slug = ?", slug);
    if (existingCompany) {
       slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
    }

    const existingUser = await db.get("SELECT id FROM employees WHERE email = ?", email.toLowerCase());
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const companyId = uuid();
    const employeeId = uuid();
    const hashedPass = await bcrypt.hash(password, 12);
    
    // Create company + employee in one try
    await db.run("BEGIN TRANSACTION");
    await db.run(
      "INSERT INTO companies (id, name, slug, plan, max_employees, owner_email) VALUES (?, ?, ?, ?, ?, ?)",
      [companyId, companyName, slug, "starter", 5, email.toLowerCase()]
    );
    await db.run(
      "INSERT INTO employees (id, company_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)",
      [employeeId, companyId, userName, email.toLowerCase(), hashedPass, "admin"]
    );
    await db.run("COMMIT");

    // Auto-login
    const token = jwt.sign(
      { sub: employeeId, company_id: companyId, company_slug: slug, role: "admin", plan: "starter" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, companySlug: slug, role: "admin" });

  } catch (err) {
    await db.run("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// 4. Reset Password (Company Admin only)
router.post("/reset-password", verifyToken, requireActiveCompany, requireRole("admin"), async (req, res) => {
  const { employeeId } = req.body;
  const db = getDB();
  try {
    // Verify target employee belongs to this company
    const employee = await db.get("SELECT * FROM employees WHERE id = ? AND company_id = ?", [employeeId, req.user.company_id]);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Generate a random temporary password
    const newPassword = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(newPassword, 12);

    await db.run("UPDATE employees SET password_hash = ? WHERE id = ?", [hash, employeeId]);
    await logAuthAction(db, req.user.company_id, employeeId, "password_reset_by_admin", req);

    res.json({ message: "Password reset", newPassword });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 5. Logout
router.post("/logout", (req, res) => {
  res.json({ success: true });
});

// 6. Public: List active companies (for dropdowns)
router.get("/companies/list", async (req, res) => {
  const db = getDB();
  try {
    const companies = await db.all("SELECT id, name, slug, logo_url FROM companies WHERE is_active = 1");
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

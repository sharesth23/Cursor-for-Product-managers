import express from "express";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { getDB } from "../db.js";
import { verifySuperAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(verifySuperAdmin);

// Get all companies with basic stats
router.get("/companies", async (req, res) => {
  const db = getDB();
  try {
    const companies = await db.all(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM employees WHERE company_id = c.id) as employee_count
      FROM companies c
      ORDER BY c.created_at DESC
    `);
    res.json(companies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch companies" });
  }
});

// Create a new company + first admin directly
router.post("/companies", async (req, res) => {
  const { name, owner_email, plan, max_employees, expires_at, initial_admin_name, initial_admin_password } = req.body;
  
  if (!name || !owner_email || !initial_admin_password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = getDB();
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
  try {
    const existing = await db.get("SELECT id FROM companies WHERE slug = ?", slug);
    if (existing) slug = `${slug}-${Math.floor(Math.random() * 1000)}`;

    const companyId = uuid();
    const employeeId = uuid();
    const hash = await bcrypt.hash(initial_admin_password, 12);

    await db.run("BEGIN TRANSACTION");
    await db.run(
      `INSERT INTO companies (id, name, slug, plan, max_employees, owner_email, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [companyId, name, slug, plan || "starter", max_employees || 5, owner_email, expires_at || null]
    );

    await db.run(
      `INSERT INTO employees (id, company_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employeeId, companyId, initial_admin_name || "Admin", owner_email.toLowerCase(), hash, "admin"]
    );
    await db.run("COMMIT");

    res.json({ message: "Company created successfully" });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: "Failed to create company", details: err.message });
  }
});

// Update company
router.patch("/companies/:id", async (req, res) => {
  const { plan, max_employees, expires_at, is_active } = req.body;
  const db = getDB();
  
  try {
    // Dynamic update query build
    const updates = [];
    const values = [];
    
    if (plan !== undefined) { updates.push("plan = ?"); values.push(plan); }
    if (max_employees !== undefined) { updates.push("max_employees = ?"); values.push(max_employees); }
    if (expires_at !== undefined) { updates.push("expires_at = ?"); values.push(expires_at); }
    if (is_active !== undefined) { updates.push("is_active = ?"); values.push(is_active ? 1 : 0); }

    if (updates.length > 0) {
      values.push(req.params.id);
      await db.run(`UPDATE companies SET ${updates.join(", ")} WHERE id = ?`, values);
    }
    
    res.json({ message: "Company updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update company" });
  }
});

// Delete company
router.delete("/companies/:id", async (req, res) => {
  const db = getDB();
  try {
    await db.run("BEGIN TRANSACTION");
    // Delete cascade (foreign keys not fully set to cascade, so do it manually for safety)
    await db.run("DELETE FROM current_tasks WHERE company_id = ?", req.params.id); // Assuming tasks renamed if needed, oh we have 'tasks'
    await db.run("DELETE FROM tasks WHERE company_id = ?", req.params.id); 
    await db.run("DELETE FROM uploads WHERE company_id = ?", req.params.id);
    await db.run("DELETE FROM projects WHERE company_id = ?", req.params.id);
    await db.run("DELETE FROM auth_logs WHERE company_id = ?", req.params.id);
    await db.run("DELETE FROM employees WHERE company_id = ?", req.params.id);
    await db.run("DELETE FROM companies WHERE id = ?", req.params.id);
    await db.run("COMMIT");
    res.json({ message: "Company deleted" });
  } catch (err) {
    await db.run("ROLLBACK");
    res.status(500).json({ error: "Failed to delete company" });
  }
});

// Get logs across all companies
router.get("/logs", async (req, res) => {
  const db = getDB();
  try {
    const logs = await db.all(`
      SELECT l.*, c.name as company_name, e.email as employee_email 
      FROM auth_logs l
      LEFT JOIN companies c ON l.company_id = c.id
      LEFT JOIN employees e ON l.employee_id = e.id
      ORDER BY l.created_at DESC LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;

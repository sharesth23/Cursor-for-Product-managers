import express from "express";
import { v4 as uuid } from "uuid";
import bcrypt from "bcryptjs";
import { getDB } from "../db.js";
import { verifyToken, requireRole, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);
router.use(requireActiveCompany);
router.use(requireRole("admin"));

// Get company employees + seat stats
router.get("/employees", async (req, res) => {
  const db = getDB();
  try {
    const employees = await db.all(
      "SELECT id, name, email, role, is_active, last_login_at, created_at FROM employees WHERE company_id = ? ORDER BY created_at DESC", 
      [req.user.company_id]
    );
    const company = await db.get("SELECT max_employees FROM companies WHERE id = ?", [req.user.company_id]);
    
    res.json({
      employees,
      seatsUsed: employees.length,
      maxSeats: company.max_employees
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Add new employee
router.post("/employees", async (req, res) => {
  const { name, email, role, password } = req.body;
  
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const db = getDB();
  try {
    // Check seat limit
    const employees = await db.all("SELECT id FROM employees WHERE company_id = ?", [req.user.company_id]);
    const company = await db.get("SELECT max_employees FROM companies WHERE id = ?", [req.user.company_id]);
    
    if (employees.length >= company.max_employees) {
      return res.status(403).json({ error: "Seat limit reached. Upgrade your plan or remove an employee." });
    }

    // Check if email already used globally
    const existing = await db.get("SELECT id FROM employees WHERE email = ?", [email.toLowerCase()]);
    if (existing) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const employeeId = uuid();
    const hash = await bcrypt.hash(password, 12);

    await db.run(
      "INSERT INTO employees (id, company_id, name, email, password_hash, role, invited_by) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [employeeId, req.user.company_id, name, email.toLowerCase(), hash, role, req.user.sub]
    );

    res.json({ message: "Employee created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Edit employee
router.patch("/employees/:id", async (req, res) => {
  const { name, role } = req.body;
  const db = getDB();
  try {
    // Ensure we only edit employees in our own company
    const employee = await db.get("SELECT id, role FROM employees WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Prevent removing the last admin
    if (role && role !== "admin" && employee.role === "admin") {
       const admins = await db.all("SELECT id FROM employees WHERE company_id = ? AND role = 'admin'", [req.user.company_id]);
       if (admins.length <= 1) {
         return res.status(400).json({ error: "Cannot demote the last admin" });
       }
    }

    const updates = [];
    const values = [];
    if (name) { updates.push("name = ?"); values.push(name); }
    if (role) { updates.push("role = ?"); values.push(role); }

    if (updates.length > 0) {
      values.push(req.params.id, req.user.company_id);
      await db.run(`UPDATE employees SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`, values);
    }

    res.json({ message: "Employee updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Toggle status
router.patch("/employees/:id/status", async (req, res) => {
  const { is_active } = req.body;
  const db = getDB();
  try {
    const employee = await db.get("SELECT id, role FROM employees WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    if (!employee) return res.status(404).json({ error: "Employee not found" });
    
    // Prevent deactivating yourself
    if (req.params.id === req.user.sub && !is_active) {
       return res.status(400).json({ error: "Cannot deactivate yourself" });
    }

    await db.run("UPDATE employees SET is_active = ? WHERE id = ? AND company_id = ?", [is_active ? 1 : 0, req.params.id, req.user.company_id]);
    res.json({ message: "Employee status updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update employee status" });
  }
});

export default router;

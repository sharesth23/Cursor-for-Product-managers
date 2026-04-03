import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";

dotenv.config();

let db;

export async function initDB() {
  if (db) return db;

  db = await open({
    filename: "./data.sqlite",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT,
      slug TEXT UNIQUE,
      logo_url TEXT,
      plan TEXT,
      max_employees INTEGER,
      is_active BOOLEAN DEFAULT 1,
      owner_email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      name TEXT,
      email TEXT UNIQUE,
      password_hash TEXT,
      role TEXT, -- 'admin' | 'manager' | 'member'
      is_active BOOLEAN DEFAULT 1,
      invited_by TEXT,
      last_login_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS auth_logs (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      employee_id TEXT,
      action TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      owner_id TEXT,
      name TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id)
    );

    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      project_id TEXT,
      owner_id TEXT,
      filename TEXT,
      stored_name TEXT,
      size INTEGER,
      mimetype TEXT,
      kind TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      company_id TEXT,
      project_id TEXT,
      owner_id TEXT,
      title TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(company_id) REFERENCES companies(id),
      FOREIGN KEY(project_id) REFERENCES projects(id)
    );
  `);

  await seedSuperAdmin();
  return db;
}

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (email && password) {
    const existing = await db.get("SELECT * FROM super_admins WHERE email = ?", email);
    if (!existing) {
      const hash = await bcrypt.hash(password, 12);
      await db.run(
        "INSERT INTO super_admins (id, email, password_hash) VALUES (?, ?, ?)",
        [uuid(), email, hash]
      );
      console.log(`✅ Seeded super admin: ${email}`);
    }
  }
}

export function getDB() {
  if (!db) throw new Error("Database not initialized. Call initDB() first.");
  return db;
}

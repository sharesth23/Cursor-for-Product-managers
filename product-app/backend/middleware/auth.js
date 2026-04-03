import jwt from "jsonwebtoken";
import { getDB } from "../db.js";

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { sub, company_id, company_slug, role, plan }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

export function verifySuperAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid super admin token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.SUPER_ADMIN_JWT_SECRET);
    if (decoded.role !== "super_admin") {
      return res.status(403).json({ error: "Requires super admin role" });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

const roleHierarchy = {
  admin: 3,
  manager: 2,
  member: 1,
};

export function requireRole(minRole) {
  return (req, res, next) => {
    const userRoleValue = roleHierarchy[req.user.role] || 0;
    const requiredRoleValue = roleHierarchy[minRole] || 0;

    if (userRoleValue < requiredRoleValue) {
      return res.status(403).json({ error: `Requires at least ${minRole} role` });
    }
    next();
  };
}

export async function requireActiveCompany(req, res, next) {
  const db = getDB();
  const companyId = req.user.company_id;

  if (!companyId) {
    return res.status(403).json({ error: "No company context" });
  }

  try {
    const company = await db.get("SELECT is_active, expires_at FROM companies WHERE id = ?", companyId);
    
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (!company.is_active) {
      return res.status(403).json({ error: "Company account is inactive. Contact your administrator." });
    }

    if (company.expires_at) {
      const expiryDate = new Date(company.expires_at);
      if (expiryDate < new Date()) {
        return res.status(403).json({ error: "License expired. Contact your company admin." });
      }
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Failed to check company status" });
  }
}

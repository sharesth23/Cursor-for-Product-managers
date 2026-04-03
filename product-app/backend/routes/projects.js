import express from "express";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";
import { verifyToken, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);
router.use(requireActiveCompany);

router.get("/", async (req, res) => {
  const db = getDB();
  const projects = await db.all("SELECT * FROM projects WHERE company_id = ? ORDER BY created_at DESC", [req.user.company_id]);
  res.json(projects);
});

router.post("/", async (req, res) => {
  const db = getDB();
  const project = {
    id: uuid(),
    company_id: req.user.company_id,
    owner_id: req.user.sub,
    name: req.body.name || "Untitled project",
    description: req.body.description || ""
  };
  await db.run(
    "INSERT INTO projects (id, company_id, owner_id, name, description) VALUES (?, ?, ?, ?, ?)",
    [project.id, project.company_id, project.owner_id, project.name, project.description]
  );
  res.status(201).json({ ...project, created_at: new Date().toISOString() });
});

router.get("/:projectId", async (req, res) => {
  const db = getDB();
  const project = await db.get("SELECT * FROM projects WHERE id = ? AND company_id = ?", [req.params.projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });
  res.json(project);
});

export default router;

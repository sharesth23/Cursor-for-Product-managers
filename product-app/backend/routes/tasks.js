import express from "express";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";
import { verifyToken, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);
router.use(requireActiveCompany);

router.get("/:projectId", async (req, res) => {
  const db = getDB();
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [req.params.projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const list = await db.all("SELECT * FROM tasks WHERE project_id = ? AND company_id = ? ORDER BY created_at DESC", [req.params.projectId, req.user.company_id]);
  res.json(list);
});

router.post("/:projectId", async (req, res) => {
  const db = getDB();
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [req.params.projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const task = {
    id: uuid(),
    company_id: req.user.company_id,
    project_id: req.params.projectId,
    owner_id: req.user.sub,
    title: req.body.title || "Untitled task",
    status: req.body.status || "todo"
  };

  await db.run(
    "INSERT INTO tasks (id, company_id, project_id, owner_id, title, status) VALUES (?, ?, ?, ?, ?, ?)",
    [task.id, task.company_id, task.project_id, task.owner_id, task.title, task.status]
  );
  
  res.status(201).json({ ...task, created_at: new Date().toISOString() });
});

router.patch("/:projectId/:taskId", async (req, res) => {
  const db = getDB();
  const { projectId, taskId } = req.params;
  
  const task = await db.get("SELECT id FROM tasks WHERE id = ? AND project_id = ? AND company_id = ?", [taskId, projectId, req.user.company_id]);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const updates = [];
  const values = [];
  if (req.body.title !== undefined) { updates.push("title = ?"); values.push(req.body.title); }
  if (req.body.status !== undefined) { updates.push("status = ?"); values.push(req.body.status); }

  if (updates.length > 0) {
    values.push(taskId, req.user.company_id);
    await db.run(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND company_id = ?`, values);
  }

  const updated = await db.get("SELECT * FROM tasks WHERE id = ?", [taskId]);
  res.json(updated);
});

export default router;

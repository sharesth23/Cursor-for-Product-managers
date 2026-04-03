import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuid } from "uuid";
import { getDB } from "../db.js";
import { verifyToken, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);
router.use(requireActiveCompany);

// Ensure uploads folder exists
const uploadsDir = path.resolve("uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (_req, file, cb) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/:projectId", async (req, res) => {
  const db = getDB();
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [req.params.projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const items = await db.all("SELECT * FROM uploads WHERE project_id = ? AND company_id = ? ORDER BY created_at DESC", [req.params.projectId, req.user.company_id]);
  res.json(items);
});

router.post(
  "/:projectId",
  upload.single("file"),
  async (req, res) => {
    const db = getDB();
    const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [req.params.projectId, req.user.company_id]);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (!req.file) return res.status(400).json({ error: "Missing file" });

    const record = {
      id: uuid(),
      company_id: req.user.company_id,
      project_id: req.params.projectId,
      owner_id: req.user.sub,
      filename: req.file.originalname,
      stored_name: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      kind: req.body?.kind || "evidence"
    };

    await db.run(
      `INSERT INTO uploads (id, company_id, project_id, owner_id, filename, stored_name, size, mimetype, kind)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.company_id, record.project_id, record.owner_id, record.filename, record.stored_name, record.size, record.mimetype, record.kind]
    );

    res.status(201).json({ ...record, created_at: new Date().toISOString() });
  }
);

export default router;

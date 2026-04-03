import express from "express";
import { getDB } from "../db.js";
import { verifyToken, requireActiveCompany } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);
router.use(requireActiveCompany);

// In-memory cache of latest analysis per project.
// Shape: { features, recommended_next, summary, last_run }
const latestAnalyses = new Map();

router.get("/:projectId/summary", async (req, res) => {
  const db = getDB();
  const projectId = req.params.projectId;
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const files = await db.all("SELECT * FROM uploads WHERE project_id = ? AND company_id = ?", [projectId, req.user.company_id]);
  const count = files.length;
  const filenames = files.slice(0, 5).map((f) => f.filename);

  const existing = latestAnalyses.get(projectId);

  res.json({
    projectId,
    summary:
      existing?.summary ||
      (count
        ? `Found ${count} evidence files. Example: ${filenames.join(", ")}. An AI layer would read these to propose features and tasks.`
        : "No evidence files yet. Upload interviews, tickets, or notes to get an analysis summary."),
  });
});

// GET /api/analysis/:projectId - latest analysis payload if it exists.
router.get("/:projectId", async (req, res) => {
  const db = getDB();
  const projectId = req.params.projectId;
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const analysis = latestAnalyses.get(projectId);
  if (!analysis) {
    return res.status(404).json({ error: "No analysis yet for this project." });
  }
  res.json(analysis);
});

// POST /api/analysis/:projectId
// Returns structured features + recommended_next + summary.
router.post("/:projectId", async (req, res) => {
  const db = getDB();
  const projectId = req.params.projectId;
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const files = await db.all("SELECT * FROM uploads WHERE project_id = ? AND company_id = ?", [projectId, req.user.company_id]);
  if (!files.length) {
    return res.status(400).json({
      error: "No evidence files yet. Upload at least one file before analysis.",
    });
  }

  const now = new Date().toISOString();

  // Very simple heuristic: derive up to 3 fake features based on filenames.
  const baseNames = files.map((f) => f.filename);
  const uniqueNames = Array.from(new Set(baseNames)).slice(0, 3);

  const priorities = ["high", "medium", "low"];
  const efforts = ["S", "M", "L", "XL"];

  const features = uniqueNames.map((name, index) => {
    const priority = priorities[index] || "medium";
    const effort = efforts[index] || "M";
    const why = `Users frequently mention issues related to "${name}". Addressing this should reduce confusion and improve satisfaction for this project.`;
    const customer_quotes = [
      `“Every time I try to work with ${name}, I get stuck or confused.”`,
      `“If ${name} was smoother, I would invite my team more often.”`,
    ];
    const ui_changes = `Clarify the entry point related to "${name}", reduce steps, and highlight the primary action users should take.`;
    const data_model_changes =
      'Add fields/flags to capture user progress through this flow (e.g., "onboarding_step", "last_completed_at").';

    return {
      title: `Improve experience around "${name}"`,
      priority,
      effort,
      why,
      customer_quotes,
      ui_changes,
      data_model_changes,
    };
  });

  const recommended_next =
    features[0]?.title ||
    "Upload more evidence to get stronger feature recommendations.";

  const summary = `Based on ${files.length} evidence files, we identified ${features.length} feature opportunity${
    features.length === 1 ? "" : "s"
  } focusing on onboarding friction and clarity.`;

  const payload = {
    features,
    recommended_next,
    summary,
    last_run: now,
  };

  latestAnalyses.set(projectId, payload);

  res.json(payload);
});

// Simple chat endpoint; wired for future Claude integration.
router.post("/:projectId/chat", async (req, res) => {
  const db = getDB();
  const projectId = req.params.projectId;
  const project = await db.get("SELECT id FROM projects WHERE id = ? AND company_id = ?", [projectId, req.user.company_id]);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const analysis = latestAnalyses.get(projectId);
  if (!analysis) {
    return res.status(400).json({
      error:
        "No analysis has been run yet. Run analysis before asking questions.",
    });
  }

  const { message } = req.body || {};
  const safeMessage = typeof message === "string" ? message : "";

  // Placeholder "senior PM assistant" reply using analysis context.
  const top = analysis.features?.[0];
  let reply =
    "I looked at the latest analysis summary and feature recommendations.";
  if (top) {
    reply += ` The top opportunity is "${top.title}" with ${top.priority.toUpperCase()} priority and effort ${top.effort}.`;
  }
  if (safeMessage) {
    reply += ` You asked: "${safeMessage}". Given that, I would focus first on de-risking the top feature with a small experiment and capturing clear success metrics.`;
  } else {
    reply +=
      " A good next step would be to turn the top one or two features into concrete tasks with owners and timelines.";
  }

  res.json({ reply });
});

export default router;

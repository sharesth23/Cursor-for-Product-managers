import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import superAdminRoutes from "./routes/superAdmin.js";
import companyAdminRoutes from "./routes/companyAdmin.js";
import projectRoutes from "./routes/projects.js";
import uploadRoutes from "./routes/uploads.js";
import analysisRoutes from "./routes/analysis.js";
import taskRoutes from "./routes/tasks.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: false,
  }),
);
app.use(express.json());

// Static serve uploaded files (for debugging only, not for PII in prod)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "product-app-backend" });
});

import { initDB } from "./db.js";

app.use("/api/auth", authRoutes);
app.use("/api/super", superAdminRoutes);
app.use("/api/admin", companyAdminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/analysis", analysisRoutes);
app.use("/api/tasks", taskRoutes);

initDB().then(() => {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  });
}).catch(err => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});


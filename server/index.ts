import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import "dotenv/config";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS setup
app.use(cors({
  origin: ["http://127.0.0.1:5001", "http://localhost:5001"],
  credentials: true
}));
app.use(cors());

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, '../dist/public')));

// Explicit route for policies.html (optional, for clarity)
app.get('/policies.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/public/policies.html'));
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(
    { port, host: "0.0.0.0" },
    () => {
      log(`serving on http://0.0.0.0:${port}`);
    }
  );
})();
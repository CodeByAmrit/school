require("apminsight");

const crypto = require("crypto");
const os = require("os");
const path = require("path");

const express = require("express");
const compression = require("compression");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const cors = require("cors");
const morgan = require("morgan");
const favicon = require("serve-favicon");

// App utilities / logger
const logger = require("./config/logger");

// Routers
const router = require("./router/route");
const student = require("./router/student");
const studentPortal = require("./router/student_portal");
const Gemini_router = require("./router/ai_router");
const settingsRouter = require("./routes/settings");

// Error handlers
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");

class App {
  constructor() {
    this.app = express();
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  configureMiddleware() {
    // Enable CORS - Allow requests from frontend (adjust origin as needed)
    this.app.use(cors());

    // Configure reverse proxy settings
    this.app.set("trust proxy", 1);

    // Security headers - disable default CSP, we'll add our own
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // We'll handle CSP manually
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
      }),
    );

    // Dynamic CSP with nonce for scripts - Single line string
    this.app.use((req, res, next) => {
      res.locals.nonce = crypto.randomBytes(16).toString("hex");

      // CSP must be a single line string
      const csp = `default-src 'self'; script-src 'self' 'nonce-${res.locals.nonce}' https://www.google.com https://www.gstatic.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https:; frame-src 'self' https://www.google.com; connect-src 'self';`;

      res.setHeader("Content-Security-Policy", csp);
      next();
    });

    this.app.use(
      compression({
        level: 6,
        threshold: 1024,
      }),
    );

    // Rate limiting - FIXED: Remove custom keyGenerator to let library handle it
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 500, // Note: changed from 'max' to 'limit' in newer versions
      message: "Too many requests, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
      // Don't define keyGenerator - let the library handle IP detection
      validate: {
        trustProxy: true, // Trust proxy headers
        xForwardedForHeader: true,
      },
      skip: (req, res) => {
        // Skip rate limiting for health checks and static files
        const skipPaths = [
          "/health",
          "/ready",
          "/metrics",
          "/favicon.png",
          "/robots.txt",
        ];

        return (
          skipPaths.includes(req.path) ||
          req.path.startsWith("/css/") ||
          req.path.startsWith("/js/") ||
          req.path.startsWith("/output/") ||
          req.path.startsWith("/uploads/") ||
          req.path.startsWith("/flowbite/") ||
          req.path.startsWith("/apexcharts/")
        );
      },
    });

    // Apply rate limiting
    this.app.use(limiter);

    // Logging
    if (process.env.NODE_ENV !== "production") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(
        morgan("combined", {
          skip: (req, res) => res.statusCode < 400,
          stream: {
            write: (message) => logger.info(message.trim()),
          },
        }),
      );
    }

    // Body parsing
    this.app.use(
      express.json({
        limit: "10mb",
        verify: (req, res, buf) => {
          try {
            JSON.parse(buf.toString());
          } catch (e) {
            res.status(400).json({ error: "Invalid JSON" });
            throw new Error("Invalid JSON");
          }
        },
      }),
    );

    this.app.use(
      express.urlencoded({
        limit: "10mb",
        extended: true,
        parameterLimit: 10000,
      }),
    );

    // Cookie parsing
    this.app.use(
      require("cookie-parser")(
        process.env.COOKIE_SECRET || "your-secret-key-change-this",
      ),
    );

    // Static files with proper caching
    const staticOptions = {
      maxAge: process.env.NODE_ENV === "production" ? "1d" : "0",
      setHeaders: (res, path) => {
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (path.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
        if (path.endsWith(".js")) {
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=UTF-8",
          );
        }
      },
    };

    // Static file routes
    this.app.use(
      "/css",
      express.static(path.join(__dirname, "public", "css"), staticOptions),
    );
    this.app.use(
      "/js",
      express.static(path.join(__dirname, "public", "js"), staticOptions),
    );
    this.app.use(
      "/output",
      express.static(path.join(__dirname, "output"), staticOptions),
    );

    // Check if uploads directory exists before serving it
    const fs = require("fs");
    const uploadsPath = path.join(__dirname, "uploads");
    if (fs.existsSync(uploadsPath)) {
      this.app.use("/uploads", express.static(uploadsPath, staticOptions));
    }

    // External libraries
    this.app.use(
      "/flowbite",
      express.static(path.join(__dirname, "node_modules/flowbite/dist"), {
        maxAge: "7d",
      }),
    );

    this.app.use(
      "/apexcharts",
      express.static(
        path.join(__dirname, "node_modules", "apexcharts", "dist"),
        { maxAge: "7d" },
      ),
    );

    this.app.use(
      express.static(path.join(__dirname, "public"), {
        ...staticOptions,
        index: false,
      }),
    );

    // View engine setup
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "ejs");

    if (process.env.NODE_ENV === "production") {
      this.app.set("view cache", true);
    }

    // Favicon
    this.app.use(favicon(path.join(__dirname, "public", "favicon.png")));
  }

  configureRoutes() {
    // Request logging (development only)
    if (process.env.NODE_ENV !== "production") {
      this.app.use((req, res, next) => {
        logger.info(
          `${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`,
        );
        next();
      });
    }

    // Routes
    this.app.use("/", router);
    this.app.use("/api/students/", student);
    this.app.use("/api/student/", studentPortal);
    this.app.use("/settings", settingsRouter);
    this.app.use("/ai", Gemini_router);

    // Health check endpoints
    this.app.get("/health", (req, res) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      });
    });

    this.app.get("/_whoami", (req, res) => {
      res.json({
        hostname: os.hostname(),
        container: process.env.HOSTNAME,
        pid: process.pid,
        time: new Date().toISOString(),
      });
    });

    // Readiness probe
    this.app.get("/ready", (req, res) => {
      res.status(200).json({
        status: "ready",
        timestamp: new Date().toISOString(),
      });
    });

    // Metrics endpoint
    this.app.get("/metrics", (req, res) => {
      res.json({
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
      });
    });
  }

  configureErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  startServer() {
    const PORT = process.env.PORT || 4000;

    // Error handling
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      if (process.env.NODE_ENV !== "production") {
        process.exit(1);
      }
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    });

    this.app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  }
}

module.exports = App;

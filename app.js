const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const favicon = require("serve-favicon");

const router = require("./router/route");
const student = require("./router/student");
const authRoutes = require("./services/auth");
const webhook = require("./router/webhook");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");

class App {
    constructor() {
        this.app = express();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    configureMiddleware() {
        this.app.set("trust proxy", "loopback");
        this.app.use(helmet());
        this.app.use(compression());

        this.app.use((req, res, next) => {
            res.setHeader(
                'Content-Security-Policy',
                "script-src 'self' 'nonce-ozfWMSeQ06g862KcEoWVKg==' https://www.google.com https://www.gstatic.com; " +
                "frame-src 'self' https://www.google.com;"
            );
            next();
        });

        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 700,
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        if (process.env.NODE_ENV !== "production") {
            this.app.use(morgan("combined"));
        }

        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ limit: "10mb", extended: true }));
        this.app.use(bodyParser.json({ limit: "10mb" }));
        this.app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
        this.app.use(cookieParser());

        this.app.use("/css", express.static(path.join(__dirname, "public", "css")));
        this.app.use("/js", express.static(path.join(__dirname, "public", "js")));
        this.app.use("/flowbite", express.static(path.join(__dirname, "node_modules/flowbite/dist")));
        this.app.use("/apexcharts", express.static(path.join(__dirname, "node_modules", "apexcharts", "dist")));
        this.app.use("/output", express.static(path.join(__dirname, "output")));
        this.app.use(express.static(path.join(__dirname, "public"), {
            setHeaders: (res) => res.setHeader("Access-Control-Allow-Origin", "*")
        }));

        this.app.use(favicon(path.join(__dirname, "public", "favicon.png")));
    }

    configureRoutes() {
        this.app.use(authRoutes);
        this.app.set("view engine", "ejs");
        this.app.use("/", router);
        this.app.use("/api/students/", student);
        this.app.use("/webhook", webhook);
    }

    configureErrorHandling() {
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    startServer() {
        if (process.env.NODE_ENV === "production") {
            this.app.set("view cache", true);
        }
        this.app.use((req, res) => res.status(404).render("custom404"));

        const PORT = process.env.PORT || 3000;
        this.app.listen(PORT, () => {
            console.log(`🚀 Server running at http://localhost:${PORT}`);
        });
    }
}

// const app = new App();
// app.startServer();
module.exports = App;
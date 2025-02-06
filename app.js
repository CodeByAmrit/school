const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const router = require("./router/route");
const student = require("./router/student");
const favicon = require("serve-favicon");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers");


class App {
    constructor() {
        this.app = express();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();
    }

    // Middleware Configuration
    configureMiddleware() {
        this.app.set("trust proxy", "loopback");

        this.app.use(helmet());

        this.app.use((req, res, next) => {
            res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-ozfWMSeQ06g862KcEoWVKg=='`);
            next();
        });

        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 700,
            standardHeaders: true,
            legacyHeaders: false,
        });
        this.app.use(limiter);

        this.app.use(morgan("combined"));
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ limit: "10mb", extended: true }));
        this.app.use(bodyParser.json({ limit: "10mb" }));
        this.app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
        this.app.use(cookieParser());

        this.app.use("/css", express.static(path.join(__dirname, "public", "css")));
        this.app.use("/js", express.static(path.join(__dirname, "public", "js")));
        this.app.use("/flowbite", express.static(path.join(__dirname, "node_modules/flowbite/dist")));
        this.app.use("/apexcharts", express.static(path.join(__dirname, "node_modules", "apexcharts", "dist")));
        this.app.use("/simple-datatables", express.static(path.join(__dirname, "node_modules", "simple-datatables", "dist")));
        this.app.use("/output", express.static(path.join(__dirname, "output")));

        this.app.use(express.static(path.join(__dirname, "public"), {
            setHeaders: (res, path) => {
                res.setHeader("Access-Control-Allow-Origin", "*");
                res.setHeader("Cache-Control", "public, max-age=86400");
            }
        }));

        this.app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
    }

    // Routes Configuration
    configureRoutes() {
        this.app.set("view engine", "ejs");
        this.app.use("/", router);
        this.app.use("/api/students/", student);
    }

    // Error Handling Configuration
    configureErrorHandling() {
        this.app.use(notFoundHandler);
        this.app.use(errorHandler);
    }

    // Start Server
    startServer() {
        this.app.use((req, res, next) => {
            res.status(404).render("custom404");
        });
        const PORT = process.env.PORT;
        this.app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    }
}

const app = new App();
app.startServer();

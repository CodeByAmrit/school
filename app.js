const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const router = require("./router/route");
const favicon = require("serve-favicon");
const helmet = require("helmet"); // For security headers
const rateLimit = require("express-rate-limit"); // To prevent brute-force attacks
const morgan = require("morgan"); // For logging HTTP requests
const { errorHandler, notFoundHandler } = require("./middleware/errorHandlers"); // Custom error handling

class App {
    constructor() {
        this.app = express();
        this.configureMiddleware();
        this.configureRoutes();
        this.configureErrorHandling();

    }

    // Middleware Configuration
    configureMiddleware() {
        // Security headers
        this.app.use(helmet());

        this.app.use((req, res, next) => {
            res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-ozfWMSeQ06g862KcEoWVKg=='`);
            next();
        });

        

        // Limit request rate to prevent DoS attacks
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 400, // Limit each IP to 100 requests per windowMs
        });
        this.app.use(limiter);

        // Logging HTTP requests
        this.app.use(morgan("combined"));

        // Body parsers
        this.app.use(express.json({ limit: "10mb" }));
        this.app.use(express.urlencoded({ limit: "10mb", extended: true }));
        this.app.use(bodyParser.json({ limit: "10mb" }));
        this.app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));

        // Cookies parser
        this.app.use(cookieParser());

        // Serve static files and set up path aliases
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use("/css", express.static(path.join(__dirname, "public", "css")));
        this.app.use("/js", express.static(path.join(__dirname, "public", "js")));
        this.app.use("/flowbite", express.static(path.join(__dirname, "node_modules/flowbite/dist")));
        this.app.use("/apexcharts", express.static(path.join(__dirname, "node_modules", "apexcharts", "dist")));
        this.app.use("/output", express.static(path.join(__dirname, "output")));

        // Serve favicon
        this.app.use(favicon(path.join(__dirname, "public", "favicon.ico")));
    }

    // Routes Configuration
    configureRoutes() {
        this.app.set("view engine", "ejs");

        // Mount the router
        this.app.use("/", router);
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
        const PORT = process.env.PORT || 8000;
        this.app.listen(PORT, () => {
            console.log(`Server running at http://localhost:${PORT}`);
        });
    }
}

const app = new App();


app.startServer();

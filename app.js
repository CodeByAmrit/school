const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const router = require("./router/route");
const favicon = require('serve-favicon');

const app = express();

// Serve favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Middleware
app.use(cookieParser());
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/flowbite', express.static(path.join(__dirname, 'node_modules/flowbite/dist')));
app.use("/output", express.static(path.join(__dirname, "output"))); // Expose the output directory

// View Engine
app.set("view engine", "ejs");

// Routes
app.use("/", router); // Mount the router for all defined routes

// Error Handling
app.use((req, res, next) => {
    res.status(404).render("custom404", { title: "404 Not Found" });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

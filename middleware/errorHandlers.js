// errorHandlers.js

// 404 Not Found handler
function notFoundHandler(req, res, next) {
    res.status(404).json({ message: "Resource not found" });
}

// General error handler
function errorHandler(err, req, res, next) {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error", error: err.message });
}

module.exports = { errorHandler, notFoundHandler };

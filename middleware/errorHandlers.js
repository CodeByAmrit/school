// errorHandlers.js

// 404 Not Found handler
function notFoundHandler(req, res, next) {
  res.status(404).render("custom404");
}

// General error handler
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("custom500");
}

module.exports = { errorHandler, notFoundHandler };

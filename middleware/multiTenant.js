const { getConnection } = require("../models/getConnection");

/**
 * Middleware to handle multi-tenancy based on custom domains.
 * It identifies the school (teacher_id) associated with the hostname
 * and injects it into the request context.
 */
async function multiTenantMiddleware(req, res, next) {
  const hostname = req.hostname;
  const mainDomain = process.env.MAIN_DOMAIN || "localhost";

  // Skip lookup for the main admin/landing domain
  if (hostname === mainDomain || hostname === "127.0.0.1") {
    req.schoolContext = null;
    return next();
  }

  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      "SELECT id, school_name, subscription_tier FROM teacher WHERE custom_domain = ?",
      [hostname],
    );

    if (rows.length > 0) {
      req.schoolContext = rows[0];
      // Store in res.locals for EJS access
      res.locals.schoolContext = rows[0];
    } else {
      req.schoolContext = null;
    }
  } catch (error) {
    console.error("Multi-tenant lookup error:", error);
    req.schoolContext = null;
  }
  next();
}

module.exports = multiTenantMiddleware;

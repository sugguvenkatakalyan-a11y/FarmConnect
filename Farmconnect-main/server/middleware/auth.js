const jwt = require("jsonwebtoken");

const authMiddleware = (roles = []) => {
  return (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log("Auth middleware - token received:", token ? "Yes" : "No"); // Debug log
    console.log("Auth middleware - required roles:", roles); // Debug log

    if (!token) {
      console.log("Auth middleware - No token provided"); // Debug log
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Auth middleware - decoded token:", decoded); // Debug log
      req.user = decoded;

      if (roles.length) {
        // Convert both user role and required roles to lowercase for comparison
        const userRole = decoded.role?.toLowerCase();
        const normalizedRoles = roles.map((role) => role.toLowerCase());

        if (!normalizedRoles.includes(userRole)) {
          console.log(
            "Auth middleware - Role check failed. User role:",
            userRole,
            "Required roles:",
            normalizedRoles
          ); // Debug log
          return res
            .status(403)
            .json({
              message: "Access denied",
              userRole,
              requiredRoles: normalizedRoles,
            });
        }
      }

      console.log("Auth middleware - Access granted"); // Debug log
      next();
    } catch (error) {
      console.log(
        "Auth middleware - Token verification failed:",
        error.message
      ); // Debug log
      res.status(401).json({ message: "Invalid token", error: error.message });
    }
  };
};

module.exports = authMiddleware;

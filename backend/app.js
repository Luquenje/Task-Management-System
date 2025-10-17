const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

const { generateToken, verifyToken } = require("./jwt");
// const { authenticateJWT, requireAdmin, setDbConnection } = require('./middleware/auth');

require("dotenv").config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 5000;

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "",
};

const connection = mysql.createConnection(dbConfig);

// Connect to MySQL
connection.connect((err) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }
  console.log("MySQL connected successfully");
});

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["production-domain.com"]
        : [
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5173",
          ],
    credentials: true, // allows cookies to be sent/received
  })
);
app.use(cookieParser());
app.use(express.json());

// JWT Authentication middleware (reads from HTTP-only cookie)
const authenticateJWT = (req, res, next) => {
  // Get token from HTTP-only cookie
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Authentication required",
      message: "No token provided",
    });
  }

  // Verify token
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
      message: "Please login again",
    });
  }

  // check ip
  if (decoded.ipAddress !== req.ip) {
    return res.status(401).json({
      success: false,
      error: "Invalid IP address",
      message: "Please login again",
    });
  }

  // check browser type

  if (decoded.browserType !== req.headers["user-agent"]) {
    return res.status(401).json({
      success: false,
      error: "Invalid browser type",
      message: "Please login again",
    });
  }

  // Add user info to request
  req.user = {
    username: decoded.username,
    ipAddress: decoded.ipAddress,
    browserType: decoded.browserType,
  };

  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.username) {
    return res.status(403).json({
      success: false,
      error: "Admin access required",
      message: "Authentication required",
    });
  }

  if (!connection) {
    return res.status(500).json({
      success: false,
      error: "Database connection not initialized",
    });
  }

  // Check user's groups from database
  const query = "SELECT user_groups FROM users WHERE username = ?";

  connection.query(query, [req.user.username], (err, results) => {
    if (err) {
      console.error("Error checking admin status:", err);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
        message: "User not found",
      });
    }

    // user_groups is already an array from the database
    let userGroups = results[0].user_groups || [];

    // Check if user has admin privileges
    // Either they are root admin (hardcoded) or have 'admin' group
    const isRootAdmin = req.user.username === "admin"; // Hardcoded root admin
    const hasAdminGroup = userGroups.includes("admin");

    if (!isRootAdmin && !hasAdminGroup) {
      return res.status(403).json({
        success: false,
        error: "Admin access required",
        message: "You do not have permission to access this resource",
      });
    }

    // Add user groups to request for convenience
    req.user.userGroups = userGroups;
    req.user.isRootAdmin = isRootAdmin;
    next();
  });
};

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    // Find user by username or email
    const findUserQuery =
      "SELECT username, email, password, Is_active, user_groups FROM users WHERE username = ? OR email = ?";

    connection.query(
      findUserQuery,
      [username, username],
      async (err, results) => {
        if (err) {
          console.error("Error finding user:", err);
          return res.status(500).json({
            success: false,
            error: "Database error during login",
          });
        }

        if (results.length === 0) {
          return res.status(401).json({
            success: false,
            error: "Invalid username or password",
          });
        }

        const user = results[0];

        // Check if user is active
        if (!user.Is_active) {
          return res.status(401).json({
            success: false,
            error: "Account is deactivated",
          });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({
            success: false,
            error: "Invalid username or password",
          });
        }

        // user_groups is already an array from the database
        let userGroups = [];
        console.log("Raw user_groups from DB:", user.user_groups);
        userGroups = user.user_groups || [];

        // Generate JWT token
        const tokenPayload = {
          username: user.username,
          ipAddress: req.ip,
          browserType: req.headers["user-agent"] || "Unknown",
        };

        const token = generateToken(tokenPayload);

        // Set JWT in HTTP-only cookie
        res.cookie("token", token, {
          httpOnly: true, // Cannot be accessed by JavaScript
          secure: process.env.NODE_ENV === "production", // HTTPS only in production
          sameSite: "lax", // CSRF protection
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });

        // Return user info (without password and without token in body)
        res.json({
          success: true,
          message: "Login successful",
          user: {
            username: user.username,
            email: user.email,
            user_groups: userGroups,
            is_active: user.Is_active,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error in login endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Logout endpoint - clear HTTP-only cookie
app.post("/logout", (req, res) => {
  // Clear the JWT cookie
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.json({
    success: true,
    message: "Logout successful",
  });
});

// Get current user info endpoint (protected with JWT)
app.get("/me", authenticateJWT, (req, res) => {
  // Get fresh user data from database
  const getUserQuery =
    "SELECT username, email, user_groups, Is_active FROM users WHERE username = ?";

  connection.query(getUserQuery, [req.user.username], (err, results) => {
    if (err) {
      console.error("Error getting user info:", err);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        success: false,
        error: "User not found",
      });
    }

    const user = results[0];

    // Check if user is still active
    if (!user.Is_active) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated",
      });
    }

    // user_groups is already an array from the database
    let userGroups = [];
    console.log("Raw user_groups from DB (/me):", user.user_groups);
    userGroups = user.user_groups || [];

    res.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        user_groups: userGroups,
        is_active: user.Is_active,
      },
    });
  });
});

// ============= USER MANAGEMENT API (Admin Only) =============

// Get all users
app.get("/api/users", authenticateJWT, requireAdmin, (req, res) => {
  const query =
    "SELECT username, email, user_groups, Is_active FROM users ORDER BY username";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch users",
      });
    }

    // user_groups is already an array from the database
    const usersWithGroups = results.map((user) => {
      return {
        ...user,
        user_groups: user.user_groups || [],
      };
    });

    res.json({
      success: true,
      users: usersWithGroups,
      count: usersWithGroups.length,
    });
  });
});

// Get single user
app.get("/api/users/:username", authenticateJWT, requireAdmin, (req, res) => {
  const { username } = req.params;
  const query =
    "SELECT username, email, user_groups, Is_active FROM users WHERE username = ?";

  connection.query(query, [username], (err, results) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch user",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const user = results[0];

    // user_groups is already an array from the database
    res.json({
      success: true,
      user: {
        ...user,
        user_groups: user.user_groups || [],
      },
    });
  });
});

// Create new user
app.post("/api/users", authenticateJWT, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, user_groups } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: "Username, email, and password are required",
      });
    }

    // Validate user_groups is an array
    let userGroupsArray = [];
    if (user_groups) {
      if (Array.isArray(user_groups)) {
        userGroupsArray = user_groups;
      } else {
        return res.status(400).json({
          success: false,
          error: "user_groups must be an array",
        });
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // user_groups is stored as JSON in database but received as array
    const userGroupsJson = JSON.stringify(userGroupsArray);

    // Insert user
    const insertQuery =
      "INSERT INTO users (username, email, password, user_groups, Is_active) VALUES (?, ?, ?, ?, TRUE)";

    connection.query(
      insertQuery,
      [username, email, hashedPassword, userGroupsJson],
      (err, result) => {
        if (err) {
          console.error("Error creating user:", err);

          if (err.code === "ER_DUP_ENTRY") {
            if (
              err.message.includes("username") ||
              err.message.includes("PRIMARY")
            ) {
              return res.status(409).json({
                success: false,
                error: "Username already exists",
              });
            } else if (err.message.includes("email")) {
              return res.status(409).json({
                success: false,
                error: "Email already exists",
              });
            }
          }

          return res.status(500).json({
            success: false,
            error: "Failed to create user",
            message: err.message,
          });
        }

        res.status(201).json({
          success: true,
          message: "User created successfully",
          user: {
            username,
            email,
            user_groups: userGroupsArray,
            is_active: true,
          },
        });
      }
    );
  } catch (error) {
    console.error("Error in create user endpoint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Update user
app.put(
  "/api/users/:username",
  authenticateJWT,
  requireAdmin,
  async (req, res) => {
    try {
      const { username } = req.params;
      const { email, password, user_groups, is_active } = req.body;

      // Check if user exists
      const checkQuery = "SELECT username FROM users WHERE username = ?";
      connection.query(checkQuery, [username], async (err, results) => {
        if (err) {
          return res.status(500).json({
            success: false,
            error: "Database error",
          });
        }

        if (results.length === 0) {
          return res.status(404).json({
            success: false,
            error: "User not found",
          });
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];

        if (email !== undefined) {
          updateFields.push("email = ?");
          updateValues.push(email);
        }

        if (password !== undefined && password !== "") {
          const hashedPassword = await bcrypt.hash(password, 12);
          updateFields.push("password = ?");
          updateValues.push(hashedPassword);
        }

        if (user_groups !== undefined) {
          // Validate user_groups is an array
          let userGroupsArray = [];
          if (Array.isArray(user_groups)) {
            userGroupsArray = user_groups;
          } else {
            return res.status(400).json({
              success: false,
              error: "user_groups must be an array",
            });
          }

          // user_groups is stored as JSON in database but received as array
          const userGroupsJson = JSON.stringify(userGroupsArray);
          updateFields.push("user_groups = ?");
          updateValues.push(userGroupsJson);
        }

        if (is_active !== undefined) {
          updateFields.push("Is_active = ?");
          updateValues.push(is_active);
        }

        if (updateFields.length === 0) {
          return res.status(400).json({
            success: false,
            error: "No fields to update",
          });
        }

        updateValues.push(username);
        const updateQuery = `UPDATE users SET ${updateFields.join(
          ", "
        )} WHERE username = ?`;

        connection.query(updateQuery, updateValues, (err, result) => {
          if (err) {
            console.error("Error updating user:", err);

            if (err.code === "ER_DUP_ENTRY" && err.message.includes("email")) {
              return res.status(409).json({
                success: false,
                error: "Email already exists",
              });
            }

            return res.status(500).json({
              success: false,
              error: "Failed to update user",
              message: err.message,
            });
          }

          res.json({
            success: true,
            message: "User updated successfully",
          });
        });
      });
    } catch (error) {
      console.error("Error in update user endpoint:", error);
      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);
// Delete user
app.delete(
  "/api/users/:username",
  authenticateJWT,
  requireAdmin,
  (req, res) => {
    const { username } = req.params;

    // Prevent deleting yourself
    if (username === req.user.username) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete your own account",
      });
    }

    const deleteQuery = "DELETE FROM users WHERE username = ?";

    connection.query(deleteQuery, [username], (err, result) => {
      if (err) {
        console.error("Error deleting user:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to delete user",
          message: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "User not found",
        });
      }

      res.json({
        success: true,
        message: "User deleted successfully",
      });
    });
  }
);

// ============= USER GROUPS API (Admin Only) =============

// Get all user groups
app.get("/api/user-groups", authenticateJWT, requireAdmin, (req, res) => {
  const query = "SELECT group_name FROM user_groups ORDER BY group_name";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching user groups:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch user groups",
      });
    }

    res.json({
      success: true,
      groups: results.map((r) => r.group_name),
      count: results.length,
    });
  });
});

// Create new user group
app.post("/api/user-groups", authenticateJWT, requireAdmin, (req, res) => {
  const { group_name } = req.body;

  if (!group_name || group_name.trim() === "") {
    return res.status(400).json({
      success: false,
      error: "Group name is required",
    });
  }

  if (group_name.length > 10) {
    return res.status(400).json({
      success: false,
      error: "Group name must be 10 characters or less",
    });
  }

  const insertQuery = "INSERT INTO user_groups (group_name) VALUES (?)";

  connection.query(insertQuery, [group_name.trim()], (err, result) => {
    if (err) {
      console.error("Error creating user group:", err);

      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          error: "User group already exists",
        });
      }

      return res.status(500).json({
        success: false,
        error: "Failed to create user group",
        message: err.message,
      });
    }

    res.status(201).json({
      success: true,
      message: "User group created successfully",
      group_name: group_name.trim(),
    });
  });
});

// Delete user group
app.delete(
  "/api/user-groups/:group_name",
  authenticateJWT,
  requireAdmin,
  (req, res) => {
    const { group_name } = req.params;

    // Prevent deleting admin group
    if (group_name === "admin") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete admin group",
      });
    }

    // Check if any users are using this group
    const checkQuery =
      "SELECT COUNT(*) as count FROM users WHERE user_group = ?";

    connection.query(checkQuery, [group_name], (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: "Database error",
        });
      }

      if (results[0].count > 0) {
        return res.status(400).json({
          success: false,
          error: `Cannot delete group. ${results[0].count} user(s) are assigned to this group`,
        });
      }

      const deleteQuery = "DELETE FROM user_groups WHERE group_name = ?";

      connection.query(deleteQuery, [group_name], (err, result) => {
        if (err) {
          console.error("Error deleting user group:", err);
          return res.status(500).json({
            success: false,
            error: "Failed to delete user group",
            message: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: "User group not found",
          });
        }

        res.json({
          success: true,
          message: "User group deleted successfully",
        });
      });
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  connection.end(() => {
    console.log("MySQL connection closed");
    process.exit(0);
  });
});

module.exports = app;

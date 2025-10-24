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

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,10}$/;

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

    let userGroups = results[0].user_groups || [];

    // Check if user has admin privileges
    // Either they are root admin (hardcoded) or have 'admin' group
    const isRootAdmin = req.user.username === "root_admin"; // Hardcoded root admin
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

const checkUserStatus = (req, res, next) => {
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
  const query = "SELECT Is_active FROM users WHERE username = ?";

  connection.query(query, [req.user.username], (err, results) => {
    if (err) {
      console.error("Error checking user status:", err);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    if (results.length === 0) {
      return res.status(403).json({
        success: false,
        error: "User not found",
        message: "User not found",
      });
    }

    console.log(results[0]);

    req.user.is_active = results[0].Is_active;
    next();
  });
};

function checkGroup(username, groupname) {
  if (!connection) {
    return res.status(500).json({
      success: false,
      error: "Database connection not initialized",
    });
  }

  // Check user's groups from database
  const query = "SELECT user_groups FROM users WHERE username = ?";

  connection.query(query, [username], (err, results) => {
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

    return userGroups.includes(groupname);
  });
}

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password cannot be empty",
      });
    }

    // Find user by username or email
    const findUserQuery =
      "SELECT username, email, password, Is_active, user_groups FROM users WHERE BINARY username = ? OR email = ?";

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
            error: "Disabled Account",
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
          maxAge: 1 * 60 * 60 * 1000, // 1 hours
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
        error: "Disabled Account",
      });
    }

    // user_groups is already an array from the database
    let userGroups = [];
    // console.log("Raw user_groups from DB (/me):", user.user_groups);
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

    if (!emailRegex.test(email) || !passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        error: "Email or password does not meet requirements",
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
  checkUserStatus,
  async (req, res) => {
    try {
      const { username } = req.params;
      const { email, password, user_groups, is_active } = req.body;
      const { is_active: curr_user_is_active } = req.user;
      // const { isRootAdmin } = req.user;s
      console.log(curr_user_is_active);
      if (!curr_user_is_active) {
        return res.status(400).json({
          success: false,
          error: "User has been disabled",
        });
      }

      if (
        !emailRegex.test(email) || password
          ? !passwordRegex.test(password)
          : false
      ) {
        return res.status(400).json({
          success: false,
          error: "Email or password does not meet requirements",
        });
      }

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

        const isRootAdmin = username === "root_admin";

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

          const hasNoAdmin = !userGroupsArray.includes("admin");
          if (hasNoAdmin && isRootAdmin) {
            return res.status(400).json({
              success: false,
              error: "Cannot remove admin group for root admin",
            });
          }

          // user_groups is stored as JSON in database but received as array
          const userGroupsJson = JSON.stringify(userGroupsArray);
          updateFields.push("user_groups = ?");
          updateValues.push(userGroupsJson);
        }

        if (is_active !== undefined) {
          if (isRootAdmin && is_active === false) {
            return res.status(400).json({
              success: false,
              error: "Cannot disable this user",
            });
          }
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

// ============= APPLICATION MANAGEMENT API =============

// Get all applications
app.get("/api/applications", authenticateJWT, (req, res) => {
  const query = "SELECT * FROM application ORDER BY App_Acronym";

  connection.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching applications:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch applications",
      });
    }

    res.json({
      success: true,
      applications: results,
      count: results.length,
    });
  });
});

// Get single application
app.get("/api/applications/:acronym", authenticateJWT, (req, res) => {
  const { acronym } = req.params;
  const query = "SELECT * FROM application WHERE App_Acronym = ?";

  connection.query(query, [acronym], (err, results) => {
    if (err) {
      console.error("Error fetching application:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch application",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    res.json({
      success: true,
      application: results[0],
    });
  });
});

// Create new application (Admin only)
app.post("/api/applications", authenticateJWT, requireAdmin, (req, res) => {
  const {
    App_Acronym,
    App_Description,
    App_startDate,
    App_endDate,
    App_permit_Open,
    App_permit_toDoList,
    App_permit_Doing,
    App_permit_Done,
  } = req.body;

  // Validation
  if (!App_Acronym) {
    return res.status(400).json({
      success: false,
      error: "Application acronym is required",
    });
  }

  const insertQuery = `INSERT INTO application
    (App_Acronym, App_Description, App_Rnumber, App_startDate, App_endDate,
     App_permit_Open, App_permit_toDoList, App_permit_Doing, App_permit_Done)
    VALUES (?, ?, 0, ?, ?, ?, ?, ?, ?)`;

  connection.query(
    insertQuery,
    [
      App_Acronym,
      App_Description || null,
      App_startDate || null,
      App_endDate || null,
      App_permit_Open || null,
      App_permit_toDoList || null,
      App_permit_Doing || null,
      App_permit_Done || null,
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating application:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            error: "Application acronym already exists",
          });
        }

        return res.status(500).json({
          success: false,
          error: "Failed to create application",
          message: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Application created successfully",
        application: { App_Acronym },
      });
    }
  );
});

// Update application (Admin only)
app.put(
  "/api/applications/:acronym",
  authenticateJWT,
  requireAdmin,
  (req, res) => {
    const { acronym } = req.params;
    const {
      App_Description,
      App_startDate,
      App_endDate,
      App_permit_Open,
      App_permit_toDoList,
      App_permit_Doing,
      App_permit_Done,
    } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (App_Description !== undefined) {
      updateFields.push("App_Description = ?");
      updateValues.push(App_Description);
    }
    if (App_startDate !== undefined) {
      updateFields.push("App_startDate = ?");
      updateValues.push(App_startDate);
    }
    if (App_endDate !== undefined) {
      updateFields.push("App_endDate = ?");
      updateValues.push(App_endDate);
    }
    if (App_permit_Open !== undefined) {
      updateFields.push("App_permit_Open = ?");
      updateValues.push(App_permit_Open);
    }
    if (App_permit_toDoList !== undefined) {
      updateFields.push("App_permit_toDoList = ?");
      updateValues.push(App_permit_toDoList);
    }
    if (App_permit_Doing !== undefined) {
      updateFields.push("App_permit_Doing = ?");
      updateValues.push(App_permit_Doing);
    }
    if (App_permit_Done !== undefined) {
      updateFields.push("App_permit_Done = ?");
      updateValues.push(App_permit_Done);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    updateValues.push(acronym);
    const updateQuery = `UPDATE application SET ${updateFields.join(
      ", "
    )} WHERE App_Acronym = ?`;

    connection.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        console.error("Error updating application:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to update application",
          message: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Application not found",
        });
      }

      res.json({
        success: true,
        message: "Application updated successfully",
      });
    });
  }
);

// ============= PLAN MANAGEMENT API =============

// Get all plans for an application
app.get("/api/applications/:acronym/plans", authenticateJWT, (req, res) => {
  const { acronym } = req.params;
  const query =
    "SELECT * FROM plan WHERE Plan_app_Acronym = ? ORDER BY Plan_startDate";

  connection.query(query, [acronym], (err, results) => {
    if (err) {
      console.error("Error fetching plans:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch plans",
      });
    }

    res.json({
      success: true,
      plans: results,
      count: results.length,
    });
  });
});

// Create new plan (Project Manager)
app.post("/api/applications/:acronym/plans", authenticateJWT, (req, res) => {
  const { acronym } = req.params;
  const { Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_color } = req.body;

  // Validation
  if (!Plan_MVP_name) {
    return res.status(400).json({
      success: false,
      error: "Plan name is required",
    });
  }

  const insertQuery = `INSERT INTO plan
    (Plan_MVP_name, Plan_startDate, Plan_endDate, Plan_app_Acronym, Plan_color)
    VALUES (?, ?, ?, ?, ?)`;

  connection.query(
    insertQuery,
    [
      Plan_MVP_name,
      Plan_startDate || null,
      Plan_endDate || null,
      acronym,
      Plan_color || "#3498db",
    ],
    (err, result) => {
      if (err) {
        console.error("Error creating plan:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({
            success: false,
            error: "Plan name already exists for this application",
          });
        }

        if (err.code === "ER_NO_REFERENCED_ROW_2") {
          return res.status(404).json({
            success: false,
            error: "Application not found",
          });
        }

        return res.status(500).json({
          success: false,
          error: "Failed to create plan",
          message: err.message,
        });
      }

      res.status(201).json({
        success: true,
        message: "Plan created successfully",
        plan: { Plan_MVP_name, Plan_app_Acronym: acronym },
      });
    }
  );
});

// Update plan
app.put(
  "/api/applications/:acronym/plans/:planName",
  authenticateJWT,
  (req, res) => {
    const { acronym, planName } = req.params;
    const { Plan_startDate, Plan_endDate, Plan_color } = req.body;

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (Plan_startDate !== undefined) {
      updateFields.push("Plan_startDate = ?");
      updateValues.push(Plan_startDate);
    }
    if (Plan_endDate !== undefined) {
      updateFields.push("Plan_endDate = ?");
      updateValues.push(Plan_endDate);
    }
    if (Plan_color !== undefined) {
      updateFields.push("Plan_color = ?");
      updateValues.push(Plan_color);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    updateValues.push(planName, acronym);
    const updateQuery = `UPDATE plan SET ${updateFields.join(
      ", "
    )} WHERE Plan_MVP_name = ? AND Plan_app_Acronym = ?`;

    connection.query(updateQuery, updateValues, (err, result) => {
      if (err) {
        console.error("Error updating plan:", err);
        return res.status(500).json({
          success: false,
          error: "Failed to update plan",
          message: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: "Plan not found",
        });
      }

      res.json({
        success: true,
        message: "Plan updated successfully",
      });
    });
  }
);

// ============= TASK MANAGEMENT API =============

// Helper function to check if user is in a specific group
function checkUserInGroup(username, groupname, callback) {
  if (!connection) {
    return callback(new Error("Database connection not initialized"), false);
  }

  const query = "SELECT user_groups FROM users WHERE username = ?";

  connection.query(query, [username], (err, results) => {
    if (err) {
      return callback(err, false);
    }

    if (results.length === 0) {
      return callback(null, false);
    }

    const userGroups = results[0].user_groups || [];
    const isInGroup = userGroups.includes(groupname);

    callback(null, isInGroup);
  });
}

// Helper function to add note to task notes (audit trail)
function addTaskNote(taskId, username, state, noteText, callback) {
  const timestamp = new Date().toISOString();
  const noteEntry = {
    username,
    state,
    timestamp,
    note: noteText,
  };

  // Get current notes
  const getNotesQuery = "SELECT Task_notes FROM task WHERE Task_id = ?";

  connection.query(getNotesQuery, [taskId], (err, results) => {
    if (err) {
      return callback(err);
    }

    if (results.length === 0) {
      return callback(new Error("Task not found"));
    }

    let notes = [];
    if (results[0].Task_notes) {
      try {
        notes = JSON.parse(results[0].Task_notes);
      } catch (e) {
        notes = [];
      }
    }

    // Add new note to beginning (most recent first)
    notes.unshift(noteEntry);

    // Update task with new notes
    const updateQuery = "UPDATE task SET Task_notes = ? WHERE Task_id = ?";
    connection.query(updateQuery, [JSON.stringify(notes), taskId], callback);
  });
}

// Get all tasks for an application
app.get("/api/applications/:acronym/tasks", authenticateJWT, (req, res) => {
  const { acronym } = req.params;
  const query =
    "SELECT * FROM task WHERE Task_app_Acronym = ? ORDER BY Task_createDate DESC";

  connection.query(query, [acronym], (err, results) => {
    if (err) {
      console.error("Error fetching tasks:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch tasks",
      });
    }

    // Parse Task_notes JSON for each task
    const tasksWithParsedNotes = results.map((task) => {
      let notes = [];
      if (task.Task_notes) {
        try {
          notes = JSON.parse(task.Task_notes);
        } catch (e) {
          notes = [];
        }
      }
      return {
        ...task,
        Task_notes: notes,
      };
    });

    res.json({
      success: true,
      tasks: tasksWithParsedNotes,
      count: tasksWithParsedNotes.length,
    });
  });
});

// Create new task (Open state) - requires App_permit_Open permission
app.post("/api/applications/:acronym/tasks", authenticateJWT, (req, res) => {
  const { acronym } = req.params;
  const { Task_name, Task_description, Task_plan } = req.body;
  const username = req.user.username;

  // Validation
  if (!Task_name) {
    return res.status(400).json({
      success: false,
      error: "Task name is required",
    });
  }

  // Get application details to check permissions and get running number
  const getAppQuery = "SELECT * FROM application WHERE App_Acronym = ?";

  connection.query(getAppQuery, [acronym], (err, appResults) => {
    if (err) {
      console.error("Error fetching application:", err);
      return res.status(500).json({
        success: false,
        error: "Database error",
      });
    }

    if (appResults.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Application not found",
      });
    }

    const app = appResults[0];
    const requiredGroup = app.App_permit_Open;

    // Check if user has permission to create tasks (Open state)
    if (!requiredGroup) {
      return res.status(403).json({
        success: false,
        error: "No group is permitted to create tasks for this application",
      });
    }

    checkUserInGroup(username, requiredGroup, (err, isInGroup) => {
      if (err) {
        console.error("Error checking user group:", err);
        return res.status(500).json({
          success: false,
          error: "Database error",
        });
      }

      if (!isInGroup) {
        return res.status(403).json({
          success: false,
          error: `You must be in the '${requiredGroup}' group to create tasks`,
        });
      }

      // User has permission, proceed with task creation
      // Generate Task_id: [App_Acronym]_[App_Rnumber]
      const newRnumber = app.App_Rnumber + 1;
      const taskId = `${acronym}_${newRnumber}`;

      // Create initial note
      const initialNote = {
        username,
        state: "Open",
        timestamp: new Date().toISOString(),
        note: "Task created",
      };

      const insertTaskQuery = `INSERT INTO task
        (Task_id, Task_name, Task_description, Task_notes, Task_plan,
         Task_app_Acronym, Task_state, Task_creator, Task_owner, Task_createDate)
        VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, ?, NOW())`;

      const updateAppQuery =
        "UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?";

      // Start transaction
      connection.beginTransaction((err) => {
        if (err) {
          console.error("Error starting transaction:", err);
          return res.status(500).json({
            success: false,
            error: "Database error",
          });
        }

        // Insert task
        connection.query(
          insertTaskQuery,
          [
            taskId,
            Task_name,
            Task_description || null,
            JSON.stringify([initialNote]),
            Task_plan || null,
            acronym,
            username,
            username,
          ],
          (err, taskResult) => {
            if (err) {
              return connection.rollback(() => {
                console.error("Error creating task:", err);
                res.status(500).json({
                  success: false,
                  error: "Failed to create task",
                  message: err.message,
                });
              });
            }

            // Update application running number
            connection.query(
              updateAppQuery,
              [newRnumber, acronym],
              (err, appResult) => {
                if (err) {
                  return connection.rollback(() => {
                    console.error("Error updating running number:", err);
                    res.status(500).json({
                      success: false,
                      error: "Failed to update running number",
                    });
                  });
                }

                // Commit transaction
                connection.commit((err) => {
                  if (err) {
                    return connection.rollback(() => {
                      console.error("Error committing transaction:", err);
                      res.status(500).json({
                        success: false,
                        error: "Failed to commit transaction",
                      });
                    });
                  }

                  res.status(201).json({
                    success: true,
                    message: "Task created successfully",
                    task: {
                      Task_id: taskId,
                      Task_name,
                      Task_state: "Open",
                    },
                  });
                });
              }
            );
          }
        );
      });
    });
  });
});

// Update task state (state transitions with permission checks)
app.patch(
  "/api/applications/:acronym/tasks/:taskId/state",
  authenticateJWT,
  (req, res) => {
    const { acronym, taskId } = req.params;
    const { new_state, note } = req.body;
    const username = req.user.username;

    const validStates = ["Open", "ToDo", "Doing", "Done", "Closed"];

    if (!validStates.includes(new_state)) {
      return res.status(400).json({
        success: false,
        error: "Invalid state",
      });
    }

    // Get current task and application details
    const getTaskAndAppQuery = `
      SELECT t.*, a.*
      FROM task t
      JOIN application a ON t.Task_app_Acronym = a.App_Acronym
      WHERE t.Task_id = ? AND t.Task_app_Acronym = ?
    `;

    connection.query(getTaskAndAppQuery, [taskId, acronym], (err, results) => {
      if (err) {
        console.error("Error fetching task:", err);
        return res.status(500).json({
          success: false,
          error: "Database error",
        });
      }

      if (results.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      const task = results[0];
      const currentState = task.Task_state;

      // Define valid state transitions
      const validTransitions = {
        Open: ["ToDo"],
        ToDo: ["Doing"],
        Doing: ["Done", "ToDo"],
        Done: ["Closed", "Doing"],
        Closed: [],
      };

      // Check if transition is valid
      if (!validTransitions[currentState].includes(new_state)) {
        return res.status(400).json({
          success: false,
          error: `Cannot transition from ${currentState} to ${new_state}`,
        });
      }

      // Check permissions based on new state
      let requiredGroup = null;
      switch (new_state) {
        case "ToDo":
          requiredGroup = task.App_permit_toDoList;
          break;
        case "Doing":
          requiredGroup = task.App_permit_Doing;
          break;
        case "Done":
          requiredGroup = task.App_permit_Doing;
          break;
        case "Closed":
          requiredGroup = task.App_permit_Done;
          break;
      }

      if (!requiredGroup) {
        return res.status(403).json({
          success: false,
          error: `No group is permitted to transition to ${new_state}`,
        });
      }

      checkUserInGroup(username, requiredGroup, (err, isInGroup) => {
        if (err) {
          console.error("Error checking user group:", err);
          return res.status(500).json({
            success: false,
            error: "Database error",
          });
        }

        if (!isInGroup) {
          return res.status(403).json({
            success: false,
            error: `You must be in the '${requiredGroup}' group to perform this action`,
          });
        }

        // User has permission, proceed with state transition
        const updateQuery = `UPDATE task
          SET Task_state = ?, Task_owner = ?
          WHERE Task_id = ?`;

        connection.query(
          updateQuery,
          [new_state, username, taskId],
          (err, result) => {
            if (err) {
              console.error("Error updating task state:", err);
              return res.status(500).json({
                success: false,
                error: "Failed to update task state",
              });
            }

            // Add audit trail note
            const noteText =
              note || `Task transitioned from ${currentState} to ${new_state}`;
            addTaskNote(taskId, username, new_state, noteText, (err) => {
              if (err) {
                console.error("Error adding task note:", err);
                // Don't fail the request if note fails
              }

              // TODO: Send email notification if transitioning to Done state
              // This would require email configuration

              res.json({
                success: true,
                message: "Task state updated successfully",
                task: {
                  Task_id: taskId,
                  Task_state: new_state,
                  Task_owner: username,
                },
              });
            });
          }
        );
      });
    });
  }
);

// Update task details (name, description, plan)
app.patch(
  "/api/applications/:acronym/tasks/:taskId",
  authenticateJWT,
  (req, res) => {
    const { acronym, taskId } = req.params;
    const { Task_description, Task_plan, note } = req.body;
    const username = req.user.username;

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (Task_description !== undefined) {
      updateFields.push("Task_description = ?");
      updateValues.push(Task_description);
    }
    if (Task_plan !== undefined) {
      updateFields.push("Task_plan = ?");
      updateValues.push(Task_plan);
    }

    if (updateFields.length === 0 && !note) {
      return res.status(400).json({
        success: false,
        error: "No fields to update",
      });
    }

    // Always update owner to current user (last touch)
    updateFields.push("Task_owner = ?");
    updateValues.push(username);

    updateValues.push(taskId, acronym);

    const updateQuery = `UPDATE task SET ${updateFields.join(
      ", "
    )} WHERE Task_id = ? AND Task_app_Acronym = ?`;

    // Get current state for note
    const getStateQuery =
      "SELECT Task_state FROM task WHERE Task_id = ? AND Task_app_Acronym = ?";

    connection.query(getStateQuery, [taskId, acronym], (err, results) => {
      if (err || results.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Task not found",
        });
      }

      const currentState = results[0].Task_state;

      connection.query(updateQuery, updateValues, (err, result) => {
        if (err) {
          console.error("Error updating task:", err);
          return res.status(500).json({
            success: false,
            error: "Failed to update task",
            message: err.message,
          });
        }

        if (result.affectedRows === 0) {
          return res.status(404).json({
            success: false,
            error: "Task not found",
          });
        }

        // Add note if provided
        if (note) {
          addTaskNote(taskId, username, currentState, note, (err) => {
            if (err) {
              console.error("Error adding task note:", err);
            }
          });
        }

        res.json({
          success: true,
          message: "Task updated successfully",
        });
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

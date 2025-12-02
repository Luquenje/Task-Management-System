const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const { verifyToken } = require("./jwt");
const { sendTaskDoneNotification } = require("./emailService");

require("dotenv").config({ path: "./.env" });

const app = express();
const PORT = process.env.PORT || 5001;

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
// Trust proxy to get correct client IP when behind reverse proxy/container
app.set('trust proxy', true);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? ["production-domain.com"]
        : [
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5001",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
          ],
    credentials: true, // allows cookies to be sent/received
  })
);
app.use(cookieParser());
app.use(express.json());

// Helper function to normalize IP addresses for comparison
// Handles IPv4, IPv6, and IPv4-mapped IPv6 addresses
const normalizeIP = (ip) => {
  if (!ip) return '';

  // Remove IPv6 prefix from IPv4-mapped addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  // Normalize localhost variations
  if (ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    return 'localhost';
  }

  return ip;
};

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

  // Normalize IPs for comparison (handles Docker networking and IPv6/IPv4 differences)
  const decodedIP = normalizeIP(decoded.ipAddress);
  const requestIP = normalizeIP(req.ip);

  console.log('Decoded IP (normalized):', decodedIP);
  console.log('Request IP (normalized):', requestIP);

  // For microservices, we can be more lenient with IP checking
  // Skip IP validation if it's a localhost/internal request
  const isLocalhost = decodedIP === 'localhost' || requestIP === 'localhost';
  const isInternalNetwork = requestIP.startsWith('172.') || requestIP.startsWith('192.168.') || requestIP.startsWith('10.');

  if (!isLocalhost && !isInternalNetwork && decodedIP !== requestIP) {
    console.log('IP validation failed:', { decodedIP, requestIP });
    return res.status(401).json({
      success: false,
      error: "Invalid IP address",
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

// ============= HELPER FUNCTIONS =============

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

    // Support multiple groups separated by commas
    // Split groupname by comma and check if user is in ANY of the groups
    const allowedGroups = groupname.split(',').map(g => g.trim());
    const isInGroup = allowedGroups.some(group => userGroups.includes(group));

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

// ============= TASK MANAGEMENT MICROSERVICE APIs =============

// Create new task (Open state) - requires App_permit_Create permission
app.post("/api/CreateTask", authenticateJWT, (req, res) => {
  const { Task_app_Acronym, Task_name, Task_description, Task_plan } = req.body;
  const username = req.user.username;

  // TMS_001: Validation - check for missing required fields
  const missingFields = [];
  if (!Task_app_Acronym) missingFields.push("Task_app_Acronym");
  if (!Task_name) missingFields.push("Task_name");

  if (missingFields.length > 0) {
    return res.status(400).json({
      code: "TMS_001"
    });
  }

  const acronym = Task_app_Acronym;

  // First check if user exists and is active (TMS_003)
  const checkUserQuery = "SELECT username, Is_active FROM users WHERE username = ?";
  connection.query(checkUserQuery, [username], (err, userResults) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({
        code: "TMS_010"
      });
    }

    // TMS_003: User doesn't exist or is inactive
    if (userResults.length === 0 || userResults[0].Is_active !== 1) {
      return res.status(403).json({
        code: "TMS_003"
      });
    }

    // Get application details to check permissions and get running number
    const getAppQuery = "SELECT * FROM application WHERE App_Acronym = ?";

    connection.query(getAppQuery, [acronym], (err, appResults) => {
      if (err) {
        console.error("Error fetching application:", err);
        return res.status(500).json({
          code: "TMS_010"
        });
      }

      // TMS_002: Application not found
      if (appResults.length === 0) {
        return res.status(404).json({
          code: "TMS_002"
        });
      }

      const app = appResults[0];
      const requiredGroup = app.App_permit_Create;

      // TMS_004: No permission group configured (user lacks permission)
      if (!requiredGroup) {
        return res.status(403).json({
          code: "TMS_004"
        });
      }

      checkUserInGroup(username, requiredGroup, (err, isInGroup) => {
        if (err) {
          console.error("Error checking user group:", err);
          return res.status(500).json({
            code: "TMS_010"
          });
        }

        // TMS_004: User not in required group
        if (!isInGroup) {
          return res.status(403).json({
            code: "TMS_004"
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
          VALUES (?, ?, ?, ?, ?, ?, 'Open', ?, NULL, NOW())`;

        const updateAppQuery =
          "UPDATE application SET App_Rnumber = ? WHERE App_Acronym = ?";

        // Start transaction
        connection.beginTransaction((err) => {
          if (err) {
            console.error("Error starting transaction:", err);
            return res.status(500).json({
              code: "TMS_010"
            });
          }

          // Insert task (Task_owner is NULL initially)
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
            ],
            (err, taskResult) => {
              if (err) {
                return connection.rollback(() => {
                  console.error("Error creating task:", err);
                  // TMS_005: Task ID collision (duplicate key error)
                  if (err.code === 'ER_DUP_ENTRY') {
                    res.status(409).json({
                      code: "TMS_005"
                    });
                  } else {
                    // TMS_010: Other database errors
                    res.status(500).json({
                      code: "TMS_010"
                    });
                  }
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
                        code: "TMS_010"
                      });
                    });
                  }

                  // Commit transaction
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => {
                        console.error("Error committing transaction:", err);
                        res.status(500).json({
                          code: "TMS_010"
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
});

// Get tasks by state (with optional application filter)
app.get("/api/GetTaskbyState", authenticateJWT, (req, res) => {
  const { Task_state, Task_app_Acronym } = req.query;
  const username = req.user.username;

  // Validation
  const validStates = ["Open", "ToDo", "Doing", "Done", "Closed"];

  // TMS_001: Required field missing
  if (!Task_state) {
    return res.status(400).json({
      code: "TMS_001"
    });
  }

  // TMS_007: Invalid task state
  if (!validStates.includes(Task_state)) {
    return res.status(400).json({
      code: "TMS_007"
    });
  }

  // TMS_003: Check if user exists and is active
  const checkUserQuery = "SELECT username, Is_active FROM users WHERE username = ?";
  connection.query(checkUserQuery, [username], (err, userResults) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({
        code: "TMS_010"
      });
    }

    if (userResults.length === 0 || userResults[0].Is_active !== 1) {
      return res.status(403).json({
        code: "TMS_003"
      });
    }

    // If Task_app_Acronym is provided, check if it exists
    if (Task_app_Acronym) {
      const checkAppQuery = "SELECT App_Acronym FROM application WHERE App_Acronym = ?";
    connection.query(checkAppQuery, [Task_app_Acronym], (err, appResults) => {
      if (err) {
        console.error("Error checking application:", err);
        return res.status(500).json({
          code: "TMS_010"
        });
      }

      // TMS_002: Application does not exist
      if (appResults.length === 0) {
        return res.status(404).json({
          code: "TMS_002"
        });
      }

      // Application exists, proceed with query
      fetchTasksByState(Task_state, Task_app_Acronym, res);
    });
  } else {
    // No application filter, proceed with query
    fetchTasksByState(Task_state, null, res);
  }

  function fetchTasksByState(state, acronym, response) {
    let query;
    let queryParams;

    if (acronym) {
      // Filter by both state and application
      query = `
        SELECT t.*
        FROM task t
        JOIN application a ON t.Task_app_Acronym = a.App_Acronym
        WHERE t.Task_state = ? AND t.Task_app_Acronym = ?
        ORDER BY t.Task_createDate DESC
      `;
      queryParams = [state, acronym];
    } else {
      // Filter by state only (all applications)
      query = `
        SELECT t.*
        FROM task t
        JOIN application a ON t.Task_app_Acronym = a.App_Acronym
        WHERE t.Task_state = ?
        ORDER BY t.Task_createDate DESC
      `;
      queryParams = [state];
    }

    connection.query(query, queryParams, (err, results) => {
      if (err) {
        console.error("Error fetching tasks:", err);
        return response.status(500).json({
          code: "TMS_010"
        });
      }

      // Parse Task_notes JSON for each task
      const tasks = results.map(task => {
        try {
          return {
            ...task,
            Task_notes: task.Task_notes ? JSON.parse(task.Task_notes) : []
          };
        } catch (e) {
          console.error("Error parsing task notes:", e);
          return {
            ...task,
            Task_notes: []
          };
        }
      });

      response.json({
        success: true,
        count: tasks.length,
        tasks: tasks
      });
    });
  }
  });
});

// Promote task from Doing to Done state
app.post("/api/PromoteTask2Done", authenticateJWT, (req, res) => {
  const { Task_id, Task_notes } = req.body;
  const username = req.user.username;

  // TMS_001: Check for missing required fields
  const missingFields = [];
  if (!Task_id) missingFields.push("Task_id");

  if (missingFields.length > 0) {
    return res.status(400).json({
      code: "TMS_001"
    });
  }

  // TMS_003: Check if user exists and is active
  const checkUserQuery = "SELECT username, Is_active FROM users WHERE username = ?";
  connection.query(checkUserQuery, [username], (err, userResults) => {
    if (err) {
      console.error("Error checking user:", err);
      return res.status(500).json({
        code: "TMS_010"
      });
    }

    if (userResults.length === 0 || userResults[0].Is_active !== 1) {
      return res.status(403).json({
        code: "TMS_003"
      });
    }

    // Get task and application details
    const getTaskAndAppQuery = `
      SELECT t.*, a.App_permit_Doing, a.App_Acronym
      FROM task t
      JOIN application a ON t.Task_app_Acronym = a.App_Acronym
      WHERE t.Task_id = ?
    `;

    connection.query(getTaskAndAppQuery, [Task_id], (err, results) => {
      if (err) {
        console.error("Error fetching task:", err);
        return res.status(500).json({
          code: "TMS_010"
        });
      }

      // TMS_008: Task not found
      if (results.length === 0) {
        return res.status(404).json({
          code: "TMS_008"
        });
      }

      const task = results[0];
      const currentState = task.Task_state;

      // TMS_009: Check if task is in Doing state
      if (currentState !== "Doing") {
        return res.status(400).json({
          code: "TMS_009"
        });
      }

      // TMS_002: Check if application exists (should always exist due to JOIN, but check anyway)
      if (!task.App_Acronym) {
        return res.status(404).json({
          code: "TMS_002"
        });
      }

      const requiredGroup = task.App_permit_Doing;

      // TMS_004: Check if permission group is configured
      if (!requiredGroup) {
        return res.status(403).json({
          code: "TMS_004"
        });
      }

      // Check if user has permission
      checkUserInGroup(username, requiredGroup, (err, isInGroup) => {
        if (err) {
          console.error("Error checking user group:", err);
          return res.status(500).json({
            code: "TMS_010"
          });
        }

        // TMS_004: User not in required group
        if (!isInGroup) {
          return res.status(403).json({
            code: "TMS_004"
          });
        }

        // User has permission, proceed with promotion
        // Parse existing notes
        let notes = [];
        try {
          notes = task.Task_notes ? JSON.parse(task.Task_notes) : [];
        } catch (e) {
          console.error("Error parsing task notes:", e);
          notes = [];
        }

        // Add new note to audit trail
        const newNote = {
          username: username,
          state: "Done",
          timestamp: new Date().toISOString(),
          note: Task_notes || "Task promoted to Done"
        };
        notes.push(newNote);

        // Update task state to Done
        const updateQuery = `
          UPDATE task
          SET Task_state = 'Done', Task_notes = ?
          WHERE Task_id = ?
        `;

        connection.query(updateQuery, [JSON.stringify(notes), Task_id], (err, result) => {
          if (err) {
            console.error("Error updating task:", err);
            return res.status(500).json({
              code: "TMS_010"
            });
          }

          // Check if task was actually updated
          if (result.affectedRows === 0) {
            return res.status(404).json({
              code: "TMS_008"
            });
          }

          // Send email notification to PL users
          const getPLUsersQuery = `
            SELECT username, email
            FROM users
            WHERE JSON_CONTAINS(user_groups, '"pl"') = 1
              AND Is_active = 1
          `;

          connection.query(getPLUsersQuery, (err, plUsers) => {
            if (!err && plUsers.length > 0) {
              sendTaskDoneNotification(plUsers, {
                Task_id: Task_id,
                Task_name: task.Task_name,
                Task_app_Acronym: task.Task_app_Acronym,
                Task_owner: task.Task_owner,
                note: Task_notes || "Task promoted to Done",
                username: username
              }).catch(emailErr => {
                console.error("Error sending email notification:", emailErr);
                // Don't fail the request if email fails
              });
            }
          });

          res.json({
            success: true,
            message: "Task promoted to Done successfully",
            task: {
              Task_id: Task_id,
              Task_state: "Done"
            }
          });
        });
      });
    });
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Task Microservice is running",
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Task Microservice running on http://localhost:${PORT}`);
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

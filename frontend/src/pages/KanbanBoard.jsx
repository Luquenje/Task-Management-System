import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Divider,
  Stack,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
} from "@mui/material";
import {
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  KeyboardArrowLeft as BackIcon,
} from "@mui/icons-material";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI, planAPI, taskAPI, userGroupAPI } from "../apis/api";

const KanbanBoard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [filterApp, setFilterApp] = useState("all");

  // Dialog states
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const [createAppDialog, setCreateAppDialog] = useState(false);
  const [createPlanDialog, setCreatePlanDialog] = useState(false);
  const [viewPlansDialog, setViewPlansDialog] = useState(false);
  const [editPlanDialog, setEditPlanDialog] = useState(false);
  const [viewAppsDialog, setViewAppsDialog] = useState(false);
  const [editAppDialog, setEditAppDialog] = useState(false);
  const [taskDetailDialog, setTaskDetailDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedApp, setSelectedApp] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    Task_name: "",
    Task_description: "",
    Task_plan: "",
    app_acronym: "",
  });
  const [appForm, setAppForm] = useState({
    App_Acronym: "",
    App_Description: "",
    App_startDate: "",
    App_endDate: "",
    // default permissions - stored as arrays, will be joined to comma-separated strings on submit
    App_permit_Create: ["pl"], // create task
    App_permit_Open: ["pm"], // release task open -> todo
    App_permit_ToDo: ["dev"], // pickup task todo -> doing
    App_permit_Doing: ["dev"], // push to done doing -> done | drop task doing -> todo
    App_permit_Done: ["pl"], // reject task done -> doing | approve task done -> close
  });
  const [planForm, setPlanForm] = useState({
    Plan_MVP_name: "",
    Plan_startDate: "",
    Plan_endDate: "",
    Plan_color: "#3498db",
    app_acronym: "",
  });
  const [noteText, setNoteText] = useState("");
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchAllData();
    fetchUserGroups();
  }, []);

  const fetchUserGroups = async () => {
    try {
      const response = await userGroupAPI.getAllGroups();
      if (response.success) {
        setUserGroups(response.groups);
      }
    } catch (err) {
      console.error("Error fetching user groups:", err);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all applications
      const appsRes = await applicationAPI.getAllApplications();
      if (appsRes.success) {
        setApplications(appsRes.applications);

        // Fetch plans and tasks for all applications
        const allPlansData = [];
        const allTasksData = [];

        for (const app of appsRes.applications) {
          // Fetch plans
          const plansRes = await planAPI.getAllPlans(app.App_Acronym);
          if (plansRes.success) {
            // Add app acronym to each plan for reference
            const plansWithApp = plansRes.plans.map((plan) => ({
              ...plan,
              app_acronym: app.App_Acronym,
            }));
            allPlansData.push(...plansWithApp);
          }

          // Fetch tasks
          const tasksRes = await taskAPI.getAllTasks(app.App_Acronym);
          if (tasksRes.success) {
            allTasksData.push(...tasksRes.tasks);
          }
        }

        setAllPlans(allPlansData);
        setAllTasks(allTasksData);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is in a specific group (supports comma-separated groups)
  const isInGroup = (groupName) => {
    if (!user || !groupName) return false;

    // Support multiple groups separated by commas
    const allowedGroups = groupName.split(",").map((g) => g.trim());
    return allowedGroups.some((group) => user.user_groups?.includes(group));
  };

  // Check permissions for specific application
  const canCreateTaskForApp = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Create);
  };

  const canTransitionToToDo = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Open);
  };

  const canTransitionToDoing = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_ToDo);
  };

  const canTransitionToDone = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Doing);
  };

  const canTransitionToClosed = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Done);
  };

  const canRejectToDoing = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Done);
  };

  const canDropToToDo = (appAcronym) => {
    const app = applications.find((a) => a.App_Acronym === appAcronym);
    return app && isInGroup(app.App_permit_Doing);
  };

  // Filter tasks
  const filteredTasks =
    filterApp === "all"
      ? allTasks
      : allTasks.filter((task) => task.Task_app_Acronym === filterApp);

  // Group tasks by state
  const tasksByState = {
    Open: filteredTasks.filter((t) => t.Task_state === "Open"),
    ToDo: filteredTasks.filter((t) => t.Task_state === "ToDo"),
    Doing: filteredTasks.filter((t) => t.Task_state === "Doing"),
    Done: filteredTasks.filter((t) => t.Task_state === "Done"),
    Closed: filteredTasks.filter((t) => t.Task_state === "Closed"),
  };

  // Get plan color
  const getPlanColor = (planName, appAcronym) => {
    const plan = allPlans.find(
      (p) => p.Plan_MVP_name === planName && p.app_acronym === appAcronym
    );
    return plan?.Plan_color || "#cccccc";
  };

  // Get plans for specific app
  const getPlansForApp = (appAcronym) => {
    return allPlans.filter((p) => p.app_acronym === appAcronym);
  };

  // Handle create task
  const handleOpenCreateTask = () => {
    setTaskForm({
      Task_name: "",
      Task_description: "",
      Task_plan: "",
      app_acronym: applications.length > 0 ? applications[0].App_Acronym : "",
    });
    setFormError(null);
    setCreateTaskDialog(true);
  };

  const handleCreateTask = async () => {
    try {
      setFormError(null);

      if (!taskForm.Task_name.trim()) {
        setFormError("Task name is required");
        return;
      }

      if (!taskForm.app_acronym) {
        setFormError("Please select an application");
        return;
      }

      const response = await taskAPI.createTask({
        Task_app_Acronym: taskForm.app_acronym,
        Task_name: taskForm.Task_name,
        Task_description: taskForm.Task_description,
        Task_plan: taskForm.Task_plan || null,
      });

      if (response.success) {
        setCreateTaskDialog(false);
        fetchAllData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create task");
    }
  };

  // Handle task detail view
  const handleOpenTaskDetail = (task) => {
    setSelectedTask(task);
    setNoteText("");
    setFormError(null);
    setTaskDetailDialog(true);
  };

  const handleCloseTaskDetail = () => {
    setTaskDetailDialog(false);
    setSelectedTask(null);
    setNoteText("");
    setFormError(null);
  };

  // Handle task state transition
  const handleStateTransition = async (task, newState) => {
    try {
      setFormError(null);

      // Validate that note is provided
      if (!noteText || !noteText.trim()) {
        setFormError("Note is required when changing task state");
        return;
      }

      const response = await taskAPI.updateTaskState(
        task.Task_app_Acronym,
        task.Task_id,
        {
          new_state: newState,
          note: noteText,
        }
      );

      if (response.success) {
        setNoteText("");
        fetchAllData();
        if (taskDetailDialog) {
          handleCloseTaskDetail();
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to update task state");
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!selectedTask || !noteText.trim()) {
      setFormError("Note cannot be empty");
      return;
    }

    try {
      setFormError(null);

      const response = await taskAPI.updateTask(
        selectedTask.Task_app_Acronym,
        selectedTask.Task_id,
        {
          note: noteText,
        }
      );

      if (response.success) {
        setNoteText("");
        fetchAllData();
        // Refresh selected task
        const updatedTasks = await taskAPI.getAllTasks(
          selectedTask.Task_app_Acronym
        );
        const updatedTask = updatedTasks.tasks.find(
          (t) => t.Task_id === selectedTask.Task_id
        );
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add note");
    }
  };

  // Handle create application
  const handleCreateApplication = async () => {
    try {
      setFormError(null);

      if (!appForm.App_Acronym.trim()) {
        setFormError("Application acronym is required");
        return;
      }

      // Convert permission arrays to comma-separated strings
      const appData = {
        ...appForm,
        App_permit_Create: appForm.App_permit_Create.join(","),
        App_permit_Open: appForm.App_permit_Open.join(","),
        App_permit_ToDo: appForm.App_permit_ToDo.join(","),
        App_permit_Doing: appForm.App_permit_Doing.join(","),
        App_permit_Done: appForm.App_permit_Done.join(","),
      };

      const response = await applicationAPI.createApplication(appData);

      if (response.success) {
        setCreateAppDialog(false);
        setAppForm({
          App_Acronym: "",
          App_Description: "",
          App_startDate: "",
          App_endDate: "",
          App_permit_Create: ["pl"],
          App_permit_Open: ["pm"],
          App_permit_ToDo: ["dev"],
          App_permit_Doing: ["dev"],
          App_permit_Done: ["pl"],
        });
        fetchAllData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create application");
    }
  };

  // Handle create plan
  const handleCreatePlan = async () => {
    try {
      setFormError(null);

      if (!planForm.Plan_MVP_name.trim()) {
        setFormError("Plan name is required");
        return;
      }

      if (!planForm.app_acronym) {
        setFormError("Please select an application");
        return;
      }

      const response = await planAPI.createPlan(planForm.app_acronym, {
        Plan_MVP_name: planForm.Plan_MVP_name,
        Plan_startDate: planForm.Plan_startDate || null,
        Plan_endDate: planForm.Plan_endDate || null,
        Plan_color: planForm.Plan_color,
      });

      if (response.success) {
        setCreatePlanDialog(false);
        setPlanForm({
          Plan_MVP_name: "",
          Plan_startDate: "",
          Plan_endDate: "",
          Plan_color: "#3498db",
          app_acronym: "",
        });
        fetchAllData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create plan");
    }
  };

  // Handle edit plan
  const handleEditPlan = async () => {
    try {
      setFormError(null);

      const response = await planAPI.updatePlan(
        selectedPlan.Plan_app_Acronym,
        selectedPlan.Plan_MVP_name,
        {
          Plan_startDate: planForm.Plan_startDate || null,
          Plan_endDate: planForm.Plan_endDate || null,
          Plan_color: planForm.Plan_color,
        }
      );

      if (response.success) {
        setEditPlanDialog(false);
        setSelectedPlan(null);
        fetchAllData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to update plan");
    }
  };

  // Handle edit application
  const handleEditApplication = async () => {
    try {
      setFormError(null);

      // Convert permission arrays to comma-separated strings
      const appData = {
        App_Description: appForm.App_Description,
        App_startDate: appForm.App_startDate || null,
        App_endDate: appForm.App_endDate || null,
        App_permit_Create: appForm.App_permit_Create.join(","),
        App_permit_Open: appForm.App_permit_Open.join(","),
        App_permit_ToDo: appForm.App_permit_ToDo.join(","),
        App_permit_Doing: appForm.App_permit_Doing.join(","),
        App_permit_Done: appForm.App_permit_Done.join(","),
      };

      const response = await applicationAPI.updateApplication(
        selectedApp.App_Acronym,
        appData
      );

      if (response.success) {
        setEditAppDialog(false);
        setSelectedApp(null);
        fetchAllData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to update application");
    }
  };

  // Render task card
  const renderTaskCard = (task) => {
    const state = task.Task_state;

    return (
      <Card
        key={task.Task_id}
        sx={{
          mb: 2,
          cursor: "pointer",
          "&:hover": { boxShadow: 4 },
          borderLeft: task.Task_plan
            ? `4px solid ${getPlanColor(task.Task_plan, task.Task_app_Acronym)}`
            : "none",
        }}
        onClick={() => handleOpenTaskDetail(task)}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {task.Task_id}
            </Typography>
            <Chip
              label={task.Task_app_Acronym}
              size="small"
              sx={{
                backgroundColor: "#5f6368",
                color: "white",
                height: "20px",
                fontSize: "0.7rem",
              }}
            />
          </Box>

          <Typography variant="body1" sx={{ fontWeight: "bold", mb: 1 }}>
            {task.Task_name}
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mb: 1,
            }}
          >
            {task.Task_description || "No description"}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 1, flexWrap: "wrap" }}>
            {task.Task_plan && (
              <Chip
                label={task.Task_plan}
                size="small"
                sx={{
                  backgroundColor: getPlanColor(
                    task.Task_plan,
                    task.Task_app_Acronym
                  ),
                  color: "white",
                  height: "20px",
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Chip
              label={task.Task_owner || "Unassigned"}
              size="small"
              variant="outlined"
              sx={{
                borderColor: task.Task_owner ? undefined : "#9e9e9e",
                color: task.Task_owner ? undefined : "#9e9e9e",
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {new Date(task.Task_createDate).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>

        {/* <CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
          {renderStateTransitionButtons(task, state)}
        </CardActions> */}
      </Card>
    );
  };

  // Render state transition buttons
  const renderStateTransitionButtons = (task, state) => {
    const buttonStyle = { fontSize: "0.7rem", py: 0.5, px: 1 };
    const appAcronym = task.Task_app_Acronym;

    switch (state) {
      case "Open":
        // No transition buttons for Open state - must release from task dialog
        return null;

      case "ToDo":
        return (
          canTransitionToDoing(appAcronym) && (
            <Button
              size="small"
              variant="contained"
              color="info"
              startIcon={<PlayArrowIcon />}
              sx={buttonStyle}
              disabled={!noteText.trim()}
              onClick={(e) => {
                e.stopPropagation();
                handleStateTransition(task, "Doing");
              }}
            >
              Start
            </Button>
          )
        );

      case "Doing":
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {canTransitionToDone(appAcronym) && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<DoneIcon />}
                sx={buttonStyle}
                disabled={!noteText.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "Done");
                }}
              >
                Done
              </Button>
            )}
            {canDropToToDo(appAcronym) && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<BackIcon />}
                sx={buttonStyle}
                disabled={!noteText.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "ToDo");
                }}
              >
                Back
              </Button>
            )}
          </Box>
        );

      case "Done":
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            {canTransitionToClosed(appAcronym) && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CloseIcon />}
                sx={buttonStyle}
                disabled={!noteText.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "Closed");
                }}
              >
                Approve
              </Button>
            )}
            {canRejectToDoing(appAcronym) && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<BackIcon />}
                sx={buttonStyle}
                disabled={!noteText.trim()}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "Doing");
                }}
              >
                Reject
              </Button>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  // Render Kanban column
  const renderColumn = (title, state, color) => {
    return (
      <Paper
        sx={{
          p: 2,
          minHeight: "70vh",
          backgroundColor: "#f5f5f5",
          minWidth: "280px",
          maxWidth: "280px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: "bold", color }}>
            {title}
          </Typography>
          <Chip
            label={tasksByState[state].length}
            size="small"
            sx={{
              backgroundColor: "#5f6368",
              color: "white",
            }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {tasksByState[state].map((task) => renderTaskCard(task))}
      </Paper>
    );
  };

  // Check if user can create tasks for any application
  const canCreateAnyTask = applications.some((app) => {
    return isInGroup(app.App_permit_Create);
  });

  if (loading) {
    return (
      <>
        <NavBar />
        <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
          <Typography>Loading...</Typography>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <NavBar />
        <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: 500, color: "#5f6368" }}
            >
              Applications
            </Typography>

            <Box sx={{ display: "flex", gap: 2 }}>
              {isInGroup("pl") && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setAppForm({
                        App_Acronym: "",
                        App_Description: "",
                        App_startDate: "",
                        App_endDate: "",
                        App_permit_Create: ["pl"],
                        App_permit_Open: ["pm"],
                        App_permit_ToDo: ["dev"],
                        App_permit_Doing: ["dev"],
                        App_permit_Done: ["pl"],
                      });
                      setFormError(null);
                      setCreateAppDialog(true);
                    }}
                    sx={{
                      backgroundColor: "#5f6368",
                      textTransform: "none",
                      borderRadius: "20px",
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#4a4d50",
                      },
                    }}
                  >
                    Add Application
                  </Button>
                  {applications.length > 0 && (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setFormError(null);
                        setViewAppsDialog(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderRadius: "20px",
                        px: 3,
                        borderColor: "#5f6368",
                        color: "#5f6368",
                        "&:hover": {
                          borderColor: "#4a4d50",
                          backgroundColor: "rgba(95, 99, 104, 0.04)",
                        },
                      }}
                    >
                      Manage Applications
                    </Button>
                  )}
                </>
              )}

              {isInGroup("pm") && applications.length > 0 && (
                <>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setPlanForm({
                        Plan_MVP_name: "",
                        Plan_startDate: "",
                        Plan_endDate: "",
                        Plan_color: "#3498db",
                        app_acronym:
                          applications.length > 0
                            ? applications[0].App_Acronym
                            : "",
                      });
                      setFormError(null);
                      setCreatePlanDialog(true);
                    }}
                    sx={{
                      backgroundColor: "#5f6368",
                      textTransform: "none",
                      borderRadius: "20px",
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#4a4d50",
                      },
                    }}
                  >
                    Add Plan
                  </Button>
                  {/* <Button
                    variant="outlined"
                    onClick={() => {
                      setFormError(null);
                      setViewPlansDialog(true);
                    }}
                    sx={{
                      textTransform: "none",
                      borderRadius: "20px",
                      px: 3,
                      borderColor: "#5f6368",
                      color: "#5f6368",
                      "&:hover": {
                        borderColor: "#4a4d50",
                        backgroundColor: "rgba(95, 99, 104, 0.04)",
                      },
                    }}
                  >
                    Manage Plans
                  </Button> */}
                </>
              )}
              {(isInGroup("pm") || isInGroup("pl")) &&
                applications.length > 0 && (
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setFormError(null);
                      setViewPlansDialog(true);
                    }}
                    sx={{
                      textTransform: "none",
                      borderRadius: "20px",
                      px: 3,
                      borderColor: "#5f6368",
                      color: "#5f6368",
                      "&:hover": {
                        borderColor: "#4a4d50",
                        backgroundColor: "rgba(95, 99, 104, 0.04)",
                      },
                    }}
                  >
                    Manage Plans
                  </Button>
                )}

              {canCreateAnyTask && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateTask}
                  sx={{
                    backgroundColor: "#5f6368",
                    textTransform: "none",
                    borderRadius: "20px",
                    px: 3,
                    "&:hover": {
                      backgroundColor: "#4a4d50",
                    },
                  }}
                >
                  Create Task
                </Button>
              )}
            </Box>
          </Box>

          {/* Application Filter */}
          {/* <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Application</InputLabel>
            <Select
              value={filterApp}
              label="Filter by Application"
              onChange={(e) => setFilterApp(e.target.value)}
              size="small"
            >
              <MenuItem value="all">All Applications</MenuItem>
              {applications.map((app) => (
                <MenuItem key={app.App_Acronym} value={app.App_Acronym}>
                  {app.App_Acronym}
                </MenuItem>
              ))}
            </Select>
          </FormControl> */}
        </Box>

        {/* Kanban Board */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            overflowX: "auto",
            pb: 2,
          }}
        >
          {renderColumn("Open", "Open", "#9e9e9e")}
          {renderColumn("To Do", "ToDo", "#2196f3")}
          {renderColumn("Doing", "Doing", "#ff9800")}
          {renderColumn("Done", "Done", "#4caf50")}
          {renderColumn("Closed", "Closed", "#607d8b")}
        </Box>

        {/* Create Application Dialog */}
        <Dialog
          open={createAppDialog}
          onClose={() => setCreateAppDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Create New Application</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="Application Acronym"
              fullWidth
              required
              value={appForm.App_Acronym}
              onChange={(e) =>
                setAppForm({ ...appForm, App_Acronym: e.target.value })
              }
              helperText="Short identifier for the application (e.g., DEMO, PROJ1)"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={appForm.App_Description}
              onChange={(e) =>
                setAppForm({ ...appForm, App_Description: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appForm.App_startDate}
              onChange={(e) =>
                setAppForm({ ...appForm, App_startDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appForm.App_endDate}
              onChange={(e) =>
                setAppForm({ ...appForm, App_endDate: e.target.value })
              }
              sx={{ mb: 3 }}
            />

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: "bold", color: "#5f6368" }}
            >
              Permissions
            </Typography>

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Create}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Create: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Create Task Permission"
                  helperText="User groups that can create tasks (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Open}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Open: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Release Task Permission (Open → ToDo)"
                  helperText="User groups that can release tasks from Open to ToDo (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_ToDo}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_ToDo: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Pickup Task Permission (ToDo → Doing)"
                  helperText="User groups that can pickup tasks from ToDo to Doing (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Doing}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Doing: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Work on Task Permission (Doing)"
                  helperText="User groups that can push to Done or drop back to ToDo (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Done}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Done: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Approve/Reject Task Permission (Done)"
                  helperText="User groups that can approve to Close or reject to Doing (multiple allowed)"
                />
              )}
              sx={{ mb: 1 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setCreateAppDialog(false)}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateApplication}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#5f6368",
                "&:hover": {
                  backgroundColor: "#4a4d50",
                },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Plan Dialog */}
        <Dialog
          open={createPlanDialog}
          onClose={() => setCreatePlanDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Create New Plan</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <FormControl fullWidth margin="dense" required sx={{ mb: 2 }}>
              <InputLabel>Application</InputLabel>
              <Select
                value={planForm.app_acronym}
                label="Application"
                onChange={(e) =>
                  setPlanForm({ ...planForm, app_acronym: e.target.value })
                }
              >
                {applications.map((app) => (
                  <MenuItem key={app.App_Acronym} value={app.App_Acronym}>
                    {app.App_Acronym}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              autoFocus
              margin="dense"
              label="Plan Name (MVP)"
              fullWidth
              required
              value={planForm.Plan_MVP_name}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_MVP_name: e.target.value })
              }
              helperText="Name of the plan or MVP"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={planForm.Plan_startDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_startDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={planForm.Plan_endDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_endDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Color"
              type="color"
              fullWidth
              value={planForm.Plan_color}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_color: e.target.value })
              }
              helperText="Color for visual distinction on task cards"
              sx={{ mb: 1 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setCreatePlanDialog(false)}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#5f6368",
                "&:hover": {
                  backgroundColor: "#4a4d50",
                },
              }}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* View/Manage Plans Dialog */}
        <Dialog
          open={viewPlansDialog}
          onClose={() => setViewPlansDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Manage Plans</DialogTitle>
          <DialogContent>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 2, display: "block" }}
            >
              View and edit existing plans
            </Typography>

            {allPlans.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No plans created yet
              </Typography>
            ) : (
              <Box>
                {applications.map((app) => {
                  const appPlans = allPlans.filter(
                    (p) => p.app_acronym === app.App_Acronym
                  );
                  if (appPlans.length === 0) return null;

                  return (
                    <Box key={app.App_Acronym} sx={{ mb: 3 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold", mb: 1, color: "#5f6368" }}
                      >
                        {app.App_Acronym}
                      </Typography>
                      {appPlans.map((plan) => (
                        <Paper
                          key={plan.Plan_MVP_name}
                          sx={{
                            p: 2,
                            mb: 1,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            borderLeft: `4px solid ${plan.Plan_color}`,
                          }}
                        >
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: "bold" }}
                            >
                              {plan.Plan_MVP_name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {plan.Plan_startDate && plan.Plan_endDate
                                ? `${new Date(
                                    plan.Plan_startDate
                                  ).toLocaleDateString()} - ${new Date(
                                    plan.Plan_endDate
                                  ).toLocaleDateString()}`
                                : "No dates set"}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setSelectedPlan(plan);

                              // Helper function to format date for input field (properly handles timezone)
                              const formatDateForInput = (dateValue) => {
                                if (!dateValue) return "";

                                // Create a Date object from the value
                                const date = new Date(dateValue);

                                // Get local date components (not UTC)
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');

                                return `${year}-${month}-${day}`;
                              };

                              setPlanForm({
                                Plan_MVP_name: plan.Plan_MVP_name,
                                Plan_startDate: formatDateForInput(plan.Plan_startDate),
                                Plan_endDate: formatDateForInput(plan.Plan_endDate),
                                Plan_color: plan.Plan_color,
                                app_acronym: plan.app_acronym,
                              });
                              setFormError(null);
                              setEditPlanDialog(true);
                            }}
                            sx={{
                              textTransform: "none",
                              borderColor: "#5f6368",
                              color: "#5f6368",
                            }}
                          >
                            Edit
                          </Button>
                        </Paper>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setViewPlansDialog(false)}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Plan Dialog */}
        <Dialog
          open={editPlanDialog}
          onClose={() => {
            setEditPlanDialog(false);
            setSelectedPlan(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Edit Plan</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              margin="dense"
              label="Plan Name (MVP)"
              fullWidth
              disabled
              value={planForm.Plan_MVP_name}
              helperText="Plan name cannot be changed"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={planForm.Plan_startDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_startDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={planForm.Plan_endDate}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_endDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Color"
              type="color"
              fullWidth
              value={planForm.Plan_color}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_color: e.target.value })
              }
              helperText="Color for visual distinction on task cards"
              sx={{ mb: 1 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setEditPlanDialog(false);
                setSelectedPlan(null);
              }}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditPlan}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#5f6368",
                "&:hover": {
                  backgroundColor: "#4a4d50",
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* View/Manage Applications Dialog */}
        <Dialog
          open={viewAppsDialog}
          onClose={() => setViewAppsDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Manage Applications</DialogTitle>
          <DialogContent>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 2, display: "block" }}
            >
              View and edit existing applications
            </Typography>

            {applications.length === 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 4 }}
              >
                No applications created yet
              </Typography>
            ) : (
              <Box>
                {applications.map((app) => (
                  <Paper
                    key={app.App_Acronym}
                    sx={{
                      p: 2,
                      mb: 2,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: "bold", mb: 1 }}
                      >
                        {app.App_Acronym}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {app.App_Description || "No description"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.App_startDate && app.App_endDate
                          ? `${new Date(
                              app.App_startDate
                            ).toLocaleDateString()} - ${new Date(
                              app.App_endDate
                            ).toLocaleDateString()}`
                          : "No dates set"}
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedApp(app);

                        // Helper function to format date for input field (properly handles timezone)
                        const formatDateForInput = (dateValue) => {
                          if (!dateValue) return "";

                          // Create a Date object from the value
                          const date = new Date(dateValue);

                          // Get local date components (not UTC)
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');

                          return `${year}-${month}-${day}`;
                        };

                        // Parse comma-separated permissions back to arrays
                        setAppForm({
                          App_Acronym: app.App_Acronym,
                          App_Description: app.App_Description || "",
                          App_startDate: formatDateForInput(app.App_startDate),
                          App_endDate: formatDateForInput(app.App_endDate),
                          App_permit_Create: app.App_permit_Create
                            ? app.App_permit_Create.split(",").map((g) =>
                                g.trim()
                              )
                            : [],
                          App_permit_Open: app.App_permit_Open
                            ? app.App_permit_Open.split(",").map((g) =>
                                g.trim()
                              )
                            : [],
                          App_permit_ToDo: app.App_permit_ToDo
                            ? app.App_permit_ToDo.split(",").map((g) =>
                                g.trim()
                              )
                            : [],
                          App_permit_Doing: app.App_permit_Doing
                            ? app.App_permit_Doing.split(",").map((g) =>
                                g.trim()
                              )
                            : [],
                          App_permit_Done: app.App_permit_Done
                            ? app.App_permit_Done.split(",").map((g) =>
                                g.trim()
                              )
                            : [],
                        });
                        setFormError(null);
                        setEditAppDialog(true);
                      }}
                      sx={{
                        textTransform: "none",
                        borderColor: "#5f6368",
                        color: "#5f6368",
                      }}
                    >
                      Edit
                    </Button>
                  </Paper>
                ))}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setViewAppsDialog(false)}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Application Dialog */}
        <Dialog
          open={editAppDialog}
          onClose={() => {
            setEditAppDialog(false);
            setSelectedApp(null);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>Edit Application</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              margin="dense"
              label="Application Acronym"
              fullWidth
              disabled
              value={appForm.App_Acronym}
              helperText="Application acronym cannot be changed"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={appForm.App_Description}
              onChange={(e) =>
                setAppForm({ ...appForm, App_Description: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appForm.App_startDate}
              onChange={(e) =>
                setAppForm({ ...appForm, App_startDate: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={appForm.App_endDate}
              onChange={(e) =>
                setAppForm({ ...appForm, App_endDate: e.target.value })
              }
              sx={{ mb: 3 }}
            />

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontWeight: "bold", color: "#5f6368" }}
            >
              Permissions
            </Typography>

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Create}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Create: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Create Task Permission"
                  helperText="User groups that can create tasks (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Open}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Open: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Release Task Permission (Open → ToDo)"
                  helperText="User groups that can release tasks from Open to ToDo (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_ToDo}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_ToDo: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Pickup Task Permission (ToDo → Doing)"
                  helperText="User groups that can pickup tasks from ToDo to Doing (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Doing}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Doing: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Work on Task Permission (Doing)"
                  helperText="User groups that can push to Done or drop back to ToDo (multiple allowed)"
                />
              )}
              sx={{ mb: 2 }}
            />

            <Autocomplete
              multiple
              options={userGroups}
              value={appForm.App_permit_Done}
              onChange={(event, newValue) =>
                setAppForm({ ...appForm, App_permit_Done: newValue })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  label="Approve/Reject Task Permission (Done)"
                  helperText="User groups that can approve to Close or reject to Doing (multiple allowed)"
                />
              )}
              sx={{ mb: 1 }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => {
                setEditAppDialog(false);
                setSelectedApp(null);
              }}
              sx={{ textTransform: "none", color: "#5f6368" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditApplication}
              variant="contained"
              sx={{
                textTransform: "none",
                backgroundColor: "#5f6368",
                "&:hover": {
                  backgroundColor: "#4a4d50",
                },
              }}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Task Dialog */}
        <Dialog
          open={createTaskDialog}
          onClose={() => setCreateTaskDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Task</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <FormControl fullWidth margin="dense" required>
              <InputLabel>Application</InputLabel>
              <Select
                value={taskForm.app_acronym}
                label="Application"
                onChange={(e) => {
                  setTaskForm({
                    ...taskForm,
                    app_acronym: e.target.value,
                    Task_plan: "", // Reset plan when app changes
                  });
                }}
              >
                {applications
                  .filter((app) => canCreateTaskForApp(app.App_Acronym))
                  .map((app) => (
                    <MenuItem key={app.App_Acronym} value={app.App_Acronym}>
                      {app.App_Acronym}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Task Name"
              fullWidth
              required
              value={taskForm.Task_name}
              onChange={(e) =>
                setTaskForm({ ...taskForm, Task_name: e.target.value })
              }
            />

            <TextField
              margin="dense"
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={taskForm.Task_description}
              onChange={(e) =>
                setTaskForm({ ...taskForm, Task_description: e.target.value })
              }
            />

            <TextField
              margin="dense"
              label="Plan"
              fullWidth
              select
              value={taskForm.Task_plan}
              onChange={(e) =>
                setTaskForm({ ...taskForm, Task_plan: e.target.value })
              }
              helperText="Optional: Assign task to a plan"
              disabled={!taskForm.app_acronym}
            >
              <MenuItem value="">None</MenuItem>
              {taskForm.app_acronym &&
                getPlansForApp(taskForm.app_acronym).map((plan) => (
                  <MenuItem key={plan.Plan_MVP_name} value={plan.Plan_MVP_name}>
                    {plan.Plan_MVP_name}
                  </MenuItem>
                ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateTaskDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateTask} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Task Detail Dialog */}
        <Dialog
          open={taskDetailDialog}
          onClose={handleCloseTaskDetail}
          maxWidth="lg"
          fullWidth
        >
          {selectedTask && (
            <>
              <DialogTitle>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6">{selectedTask.Task_id}</Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Chip
                      label={selectedTask.Task_app_Acronym}
                      sx={{ backgroundColor: "#5f6368", color: "white" }}
                    />
                    <Chip label={selectedTask.Task_state} color="primary" />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}

                {/* Two Column Layout */}
                <Box sx={{ display: "flex", gap: 3 }}>
                  {/* Left Column - Task Info */}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {selectedTask.Task_name}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {selectedTask.Task_description || "No description"}
                    </Typography>

                    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                      <Chip
                        label={`Owner: ${selectedTask.Task_owner || "Unassigned"}`}
                        sx={{
                          borderColor: selectedTask.Task_owner
                            ? undefined
                            : "#9e9e9e",
                          color: selectedTask.Task_owner ? undefined : "#9e9e9e",
                        }}
                        variant={selectedTask.Task_owner ? "filled" : "outlined"}
                      />
                      <Chip label={`Creator: ${selectedTask.Task_creator}`} />
                      {selectedTask.Task_plan && (
                        <Chip
                          label={`Plan: ${selectedTask.Task_plan}`}
                          sx={{
                            backgroundColor: getPlanColor(
                              selectedTask.Task_plan,
                              selectedTask.Task_app_Acronym
                            ),
                            color: "white",
                          }}
                        />
                      )}
                    </Box>

                    {/* Plan Selection Section - Only for Open state and PM */}
                    {selectedTask.Task_state === "Open" &&
                      canTransitionToToDo(selectedTask.Task_app_Acronym) && (
                        <>
                          <Divider sx={{ my: 2 }} />
                          <Typography variant="h6" sx={{ mb: 2 }}>
                            Release Task to ToDo
                          </Typography>
                          <TextField
                            margin="dense"
                            label="Plan"
                            fullWidth
                            required
                            select
                            value={selectedTask.Task_plan || ""}
                            onChange={async (e) => {
                              try {
                                setFormError(null);
                                const response = await taskAPI.updateTask(
                                  selectedTask.Task_app_Acronym,
                                  selectedTask.Task_id,
                                  {
                                    Task_plan: e.target.value || null,
                                  }
                                );

                                if (response.success) {
                                  // Refresh all data
                                  await fetchAllData();
                                  // Update selected task
                                  const updatedTasks = await taskAPI.getAllTasks(
                                    selectedTask.Task_app_Acronym
                                  );
                                  const updatedTask = updatedTasks.tasks.find(
                                    (t) => t.Task_id === selectedTask.Task_id
                                  );
                                  setSelectedTask(updatedTask);
                                }
                              } catch (err) {
                                setFormError(
                                  err.response?.data?.error ||
                                    "Failed to update plan"
                                );
                              }
                            }}
                            helperText="Select a plan before releasing (required)"
                            sx={{ mb: 2 }}
                          >
                            <MenuItem value="">None</MenuItem>
                            {getPlansForApp(selectedTask.Task_app_Acronym).map(
                              (plan) => (
                                <MenuItem
                                  key={plan.Plan_MVP_name}
                                  value={plan.Plan_MVP_name}
                                >
                                  {plan.Plan_MVP_name}
                                </MenuItem>
                              )
                            )}
                          </TextField>
                        </>
                      )}

                    {/* Add Note Section */}
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Add Note
                    </Typography>

                    {selectedTask.Task_state !== "Closed" && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        Note is required when changing task state
                      </Alert>
                    )}

                    <TextField
                      fullWidth
                      multiline
                      required
                      rows={3}
                      label="Add Note"
                      placeholder="Enter your note here (required for state transitions)..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      helperText={
                        selectedTask.Task_state !== "Closed"
                          ? "Required for state transitions"
                          : ""
                      }
                      sx={{ mb: 1 }}
                    />

                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddNote}
                      disabled={!noteText.trim()}
                    >
                      Add Note
                    </Button>
                  </Box>

                  {/* Right Column - Notes History */}
                  <Box sx={{ flex: 1, borderLeft: "1px solid #e0e0e0", pl: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Notes (Audit Trail)
                    </Typography>

                    <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
                      {selectedTask.Task_notes &&
                      selectedTask.Task_notes.length > 0 ? (
                        selectedTask.Task_notes.slice().reverse().map((note, index) => (
                          <Paper
                            key={index}
                            sx={{ p: 2, mb: 1, backgroundColor: "#f5f5f5" }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                mb: 1,
                              }}
                            >
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: "bold" }}
                              >
                                {note.username} • {note.state}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(note.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                            <Typography variant="body2">{note.note}</Typography>
                          </Paper>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No notes yet
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseTaskDetail}>Close</Button>
                {selectedTask.Task_state === "Open" &&
                canTransitionToToDo(selectedTask.Task_app_Acronym) ? (
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedTask.Task_plan || !noteText.trim()}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleStateTransition(selectedTask, "ToDo");
                    }}
                  >
                    Release to ToDo
                  </Button>
                ) : (
                  selectedTask.Task_state !== "Closed" &&
                  renderStateTransitionButtons(
                    selectedTask,
                    selectedTask.Task_state
                  )
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Container>
    </>
  );
};

export default KanbanBoard;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Divider,
  Stack,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  PlayArrow as PlayArrowIcon,
  Done as DoneIcon,
  Close as CloseIcon,
  ArrowForward as ArrowForwardIcon,
  Edit as EditIcon,
  KeyboardArrowLeft as BackIcon,
} from "@mui/icons-material";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI, planAPI, taskAPI, userGroupAPI } from "../apis/api";

const KanbanBoard = () => {
  const { acronym } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState(null);
  const [plans, setPlans] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [createTaskDialog, setCreateTaskDialog] = useState(false);
  const [taskDetailDialog, setTaskDetailDialog] = useState(false);
  const [createPlanDialog, setCreatePlanDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    Task_name: "",
    Task_description: "",
    Task_plan: "",
  });
  const [planForm, setPlanForm] = useState({
    Plan_MVP_name: "",
    Plan_startDate: "",
    Plan_endDate: "",
    Plan_color: "#3498db",
  });
  const [noteText, setNoteText] = useState("");
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [acronym]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appRes, plansRes, tasksRes, groupsRes] = await Promise.all([
        applicationAPI.getApplication(acronym),
        planAPI.getAllPlans(acronym),
        taskAPI.getAllTasks(acronym),
        userGroupAPI.getAllGroups(),
      ]);

      if (appRes.success) setApplication(appRes.application);
      if (plansRes.success) setPlans(plansRes.plans);
      if (tasksRes.success) setTasks(tasksRes.tasks);
      if (groupsRes.success) setUserGroups(groupsRes.groups);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // Check if user is in a specific group
  const isInGroup = (groupName) => {
    if (!user || !groupName) return false;
    return user.user_groups?.includes(groupName) || false;
  };

  // Check permissions for task creation
  const canCreateTask = () => {
    return application && isInGroup(application.App_permit_Open);
  };

  // Check permissions for state transitions
  const canTransitionToToDo = () => {
    return application && isInGroup(application.App_permit_toDoList);
  };

  const canTransitionToDoing = () => {
    return application && isInGroup(application.App_permit_Doing);
  };

  const canTransitionToDone = () => {
    return application && isInGroup(application.App_permit_Doing);
  };

  const canTransitionToClosed = () => {
    return application && isInGroup(application.App_permit_Done);
  };

  const canRejectToDoing = () => {
    return application && isInGroup(application.App_permit_Done);
  };

  // Group tasks by state
  const tasksByState = {
    Open: tasks.filter((t) => t.Task_state === "Open"),
    ToDo: tasks.filter((t) => t.Task_state === "ToDo"),
    Doing: tasks.filter((t) => t.Task_state === "Doing"),
    Done: tasks.filter((t) => t.Task_state === "Done"),
    Closed: tasks.filter((t) => t.Task_state === "Closed"),
  };

  // Get plan color
  const getPlanColor = (planName) => {
    const plan = plans.find((p) => p.Plan_MVP_name === planName);
    return plan?.Plan_color || "#cccccc";
  };

  // Handle create task
  const handleOpenCreateTask = () => {
    setTaskForm({
      Task_name: "",
      Task_description: "",
      Task_plan: "",
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

      const response = await taskAPI.createTask(acronym, taskForm);

      if (response.success) {
        setCreateTaskDialog(false);
        fetchData();
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

      const response = await taskAPI.updateTaskState(acronym, task.Task_id, {
        new_state: newState,
        note: noteText || undefined,
      });

      if (response.success) {
        setNoteText("");
        fetchData();
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

      const response = await taskAPI.updateTask(acronym, selectedTask.Task_id, {
        note: noteText,
      });

      if (response.success) {
        setNoteText("");
        fetchData();
        // Refresh selected task
        const updatedTasks = await taskAPI.getAllTasks(acronym);
        const updatedTask = updatedTasks.tasks.find(
          (t) => t.Task_id === selectedTask.Task_id
        );
        setSelectedTask(updatedTask);
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to add note");
    }
  };

  // Handle create plan
  const handleOpenCreatePlan = () => {
    setPlanForm({
      Plan_MVP_name: "",
      Plan_startDate: "",
      Plan_endDate: "",
      Plan_color: "#3498db",
    });
    setFormError(null);
    setCreatePlanDialog(true);
  };

  const handleCreatePlan = async () => {
    try {
      setFormError(null);

      if (!planForm.Plan_MVP_name.trim()) {
        setFormError("Plan name is required");
        return;
      }

      const response = await planAPI.createPlan(acronym, planForm);

      if (response.success) {
        setCreatePlanDialog(false);
        fetchData();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create plan");
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
            ? `4px solid ${getPlanColor(task.Task_plan)}`
            : "none",
        }}
        onClick={() => handleOpenTaskDetail(task)}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {task.Task_id}
            </Typography>
            {task.Task_plan && (
              <Chip
                label={task.Task_plan}
                size="small"
                sx={{
                  backgroundColor: getPlanColor(task.Task_plan),
                  color: "white",
                  height: "20px",
                  fontSize: "0.7rem",
                }}
              />
            )}
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

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Chip label={task.Task_owner} size="small" variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              {new Date(task.Task_createDate).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, px: 2, pb: 1 }}>
          {renderStateTransitionButtons(task, state)}
        </CardActions>
      </Card>
    );
  };

  // Render state transition buttons
  const renderStateTransitionButtons = (task, state) => {
    const buttonStyle = { fontSize: "0.7rem", py: 0.5, px: 1 };

    switch (state) {
      case "Open":
        return (
          canTransitionToToDo() && (
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<ArrowForwardIcon />}
              sx={buttonStyle}
              onClick={(e) => {
                e.stopPropagation();
                handleStateTransition(task, "ToDo");
              }}
            >
              Release
            </Button>
          )
        );

      case "ToDo":
        return (
          canTransitionToDoing() && (
            <Button
              size="small"
              variant="contained"
              color="info"
              startIcon={<PlayArrowIcon />}
              sx={buttonStyle}
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
            {canTransitionToDone() && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<DoneIcon />}
                sx={buttonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "Done");
                }}
              >
                Done
              </Button>
            )}
            {canTransitionToToDo() && (
              <Button
                size="small"
                variant="outlined"
                color="warning"
                startIcon={<BackIcon />}
                sx={buttonStyle}
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
            {canTransitionToClosed() && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CloseIcon />}
                sx={buttonStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleStateTransition(task, "Closed");
                }}
              >
                Approve
              </Button>
            )}
            {canRejectToDoing() && (
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<BackIcon />}
                sx={buttonStyle}
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
          <Chip label={tasksByState[state].length} size="small" color="primary" />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {tasksByState[state].map((task) => renderTaskCard(task))}
      </Paper>
    );
  };

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

  if (error || !application) {
    return (
      <>
        <NavBar />
        <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
          <Alert severity="error">{error || "Application not found"}</Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/applications")}
            sx={{ mt: 2 }}
          >
            Back to Applications
          </Button>
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
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <IconButton onClick={() => navigate("/applications")} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              {application.App_Acronym}
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 6, mb: 2 }}>
            {application.App_Description || "No description"}
          </Typography>

          <Box sx={{ display: "flex", gap: 2, ml: 6 }}>
            {canCreateTask() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreateTask}
              >
                Create Task
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenCreatePlan}
            >
              Create Plan
            </Button>
          </Box>

          {/* Plans Display */}
          {plans.length > 0 && (
            <Box sx={{ mt: 2, ml: 6 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Plans:
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {plans.map((plan) => (
                  <Chip
                    key={plan.Plan_MVP_name}
                    label={`${plan.Plan_MVP_name} (${new Date(
                      plan.Plan_startDate
                    ).toLocaleDateString()} - ${new Date(
                      plan.Plan_endDate
                    ).toLocaleDateString()})`}
                    sx={{
                      backgroundColor: plan.Plan_color,
                      color: "white",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
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

            <TextField
              autoFocus
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
            >
              <MenuItem value="">None</MenuItem>
              {plans.map((plan) => (
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
          maxWidth="md"
          fullWidth
        >
          {selectedTask && (
            <>
              <DialogTitle>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="h6">{selectedTask.Task_id}</Typography>
                  <Chip label={selectedTask.Task_state} color="primary" />
                </Box>
              </DialogTitle>
              <DialogContent>
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}

                <Typography variant="h6" sx={{ mb: 1 }}>
                  {selectedTask.Task_name}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {selectedTask.Task_description || "No description"}
                </Typography>

                <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
                  <Chip label={`Owner: ${selectedTask.Task_owner}`} />
                  <Chip label={`Creator: ${selectedTask.Task_creator}`} />
                  {selectedTask.Task_plan && (
                    <Chip
                      label={`Plan: ${selectedTask.Task_plan}`}
                      sx={{
                        backgroundColor: getPlanColor(selectedTask.Task_plan),
                        color: "white",
                      }}
                    />
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Notes Section */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Notes (Audit Trail)
                </Typography>

                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Add a note..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  sx={{ mb: 1 }}
                />

                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  sx={{ mb: 2 }}
                >
                  Add Note
                </Button>

                <Box sx={{ maxHeight: "300px", overflowY: "auto" }}>
                  {selectedTask.Task_notes &&
                  selectedTask.Task_notes.length > 0 ? (
                    selectedTask.Task_notes.map((note, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: "#f5f5f5" }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: "bold" }}>
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
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseTaskDetail}>Close</Button>
                {selectedTask.Task_state !== "Closed" &&
                  renderStateTransitionButtons(
                    selectedTask,
                    selectedTask.Task_state
                  )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Plan Dialog */}
        <Dialog
          open={createPlanDialog}
          onClose={() => setCreatePlanDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Plan</DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="Plan Name"
              fullWidth
              required
              value={planForm.Plan_MVP_name}
              onChange={(e) =>
                setPlanForm({ ...planForm, Plan_MVP_name: e.target.value })
              }
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
              helperText="Choose a color for visual distinction"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreatePlanDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default KanbanBoard;

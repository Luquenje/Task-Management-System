import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  Stack,
} from "@mui/material";
import {
  FilterList as FilterIcon,
} from "@mui/icons-material";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI, planAPI, taskAPI } from "../apis/api";
import { useNavigate } from "react-router-dom";

const ApplicationsDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [plansData, setPlansData] = useState({});
  const [tasksData, setTasksData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    App_Acronym: "",
    App_Description: "",
    App_startDate: "",
    App_endDate: "",
  });
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getAllApplications();
      if (response.success) {
        setApplications(response.applications);

        // Fetch plans and tasks for each application
        for (const app of response.applications) {
          await fetchPlansAndTasks(app.App_Acronym);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansAndTasks = async (acronym) => {
    try {
      // Fetch plans
      const plansRes = await planAPI.getAllPlans(acronym);
      if (plansRes.success) {
        setPlansData(prev => ({
          ...prev,
          [acronym]: plansRes.plans
        }));
      }

      // Fetch tasks
      const tasksRes = await taskAPI.getAllTasks(acronym);
      if (tasksRes.success) {
        setTasksData(prev => ({
          ...prev,
          [acronym]: tasksRes.tasks
        }));
      }
    } catch (err) {
      console.error(`Error fetching data for ${acronym}:`, err);
    }
  };

  const getTaskCountForPlan = (acronym, planName) => {
    const tasks = tasksData[acronym] || [];
    return tasks.filter(task => task.Task_plan === planName).length;
  };

  const handleOpenDialog = () => {
    setFormData({
      App_Acronym: "",
      App_Description: "",
      App_startDate: "",
      App_endDate: "",
    });
    setFormError(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      App_Acronym: "",
      App_Description: "",
      App_startDate: "",
      App_endDate: "",
    });
    setFormError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateApplication = async () => {
    try {
      setFormError(null);

      if (!formData.App_Acronym.trim()) {
        setFormError("Application acronym is required");
        return;
      }

      const response = await applicationAPI.createApplication(formData);

      if (response.success) {
        handleCloseDialog();
        fetchApplications();
      }
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create application");
    }
  };

  const handleViewAllTasks = (acronym) => {
    navigate(`/applications/${acronym}/kanban`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
          <Typography>Loading applications...</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 12, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: 500, color: "#5f6368" }}
          >
            Applications
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={handleOpenDialog}
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
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Applications List */}
        {applications.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No applications found
            </Typography>
            {isAdmin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Add Application" to get started
              </Typography>
            )}
          </Box>
        ) : (
          <Stack spacing={3}>
            {applications.map((app) => (
              <Paper
                key={app.App_Acronym}
                elevation={0}
                sx={{
                  p: 4,
                  borderRadius: 3,
                  backgroundColor: "#f8f9fa",
                  border: "1px solid #e0e0e0",
                }}
              >
                {/* Application Header */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 600, color: "#202124" }}
                    >
                      {app.App_Acronym}
                    </Typography>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="caption" color="text.secondary">
                        Start Date: {formatDate(app.App_startDate)}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        End Date: {formatDate(app.App_endDate)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    {app.App_Description ||
                      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."}
                  </Typography>
                </Box>

                {/* Plans Table */}
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    backgroundColor: "white",
                    mb: 2,
                    borderRadius: 2,
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: 600, color: "#5f6368", py: 1.5 }}
                        >
                          MVP Name
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, color: "#5f6368", py: 1.5 }}
                        >
                          Start Date
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 600, color: "#5f6368", py: 1.5 }}
                        >
                          End Date
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ fontWeight: 600, color: "#5f6368", py: 1.5 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            Total No. of tasks
                            <IconButton size="small">
                              <FilterIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {plansData[app.App_Acronym] &&
                      plansData[app.App_Acronym].length > 0 ? (
                        plansData[app.App_Acronym].map((plan, index) => (
                          <TableRow
                            key={plan.Plan_MVP_name}
                            sx={{
                              backgroundColor:
                                index % 2 === 0 ? "#fafafa" : "white",
                              "&:hover": {
                                backgroundColor: "#f5f5f5",
                              },
                            }}
                          >
                            <TableCell sx={{ py: 2 }}>
                              {plan.Plan_MVP_name}
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              {formatDate(plan.Plan_startDate)}
                            </TableCell>
                            <TableCell sx={{ py: 2 }}>
                              {formatDate(plan.Plan_endDate)}
                            </TableCell>
                            <TableCell align="right" sx={{ py: 2 }}>
                              {getTaskCountForPlan(
                                app.App_Acronym,
                                plan.Plan_MVP_name
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            align="center"
                            sx={{ py: 3, color: "text.secondary" }}
                          >
                            No plans created yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* View All Tasks Button */}
                <Box>
                  <Button
                    variant="contained"
                    onClick={() => handleViewAllTasks(app.App_Acronym)}
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
                    View all Tasks
                  </Button>
                </Box>
              </Paper>
            ))}
          </Stack>
        )}

        {/* Create Application Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
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
              name="App_Acronym"
              label="Application Acronym"
              fullWidth
              required
              value={formData.App_Acronym}
              onChange={handleInputChange}
              helperText="Short identifier for the application (e.g., DEMO, PROJ1)"
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="App_Description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.App_Description}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="App_startDate"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.App_startDate}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="App_endDate"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.App_endDate}
              onChange={handleInputChange}
              sx={{ mb: 1 }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 2, display: "block" }}
            >
              Note: User group permissions can be configured after creation
            </Typography>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleCloseDialog}
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
      </Container>
    </>
  );
};

export default ApplicationsDashboard;

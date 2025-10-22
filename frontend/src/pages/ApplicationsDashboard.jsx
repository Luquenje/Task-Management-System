import { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from "@mui/material";
import { Add as AddIcon, Visibility as ViewIcon } from "@mui/icons-material";
import NavBar from "../components/NavBar";
import { useAuth } from "../contexts/AuthContext";
import { applicationAPI } from "../apis/api";
import { useNavigate } from "react-router-dom";

const ApplicationsDashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
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
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
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

  const handleViewApplication = (acronym) => {
    // Navigate to kanban board view
    navigate(`/applications/${acronym}/kanban`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          <Typography>Loading applications...</Typography>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Applications
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Create Application
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Applications Grid */}
        {applications.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8 }}>
            <Typography variant="h6" color="text.secondary">
              No applications found
            </Typography>
            {isAdmin && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Click "Create Application" to get started
              </Typography>
            )}
          </Box>
        ) : (
          <Grid container spacing={3}>
            {applications.map((app) => (
              <Grid item xs={12} sm={6} md={4} key={app.App_Acronym}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    "&:hover": {
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="h5"
                        component="div"
                        sx={{ fontWeight: "bold" }}
                      >
                        {app.App_Acronym}
                      </Typography>
                      <Chip
                        label={`#${app.App_Rnumber}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2, minHeight: "40px" }}
                    >
                      {app.App_Description || "No description provided"}
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Start Date: {formatDate(app.App_startDate)}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        End Date: {formatDate(app.App_endDate)}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewApplication(app.App_Acronym)}
                    >
                      View Tasks
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Application Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Application</DialogTitle>
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
            />

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Note: User group permissions can be configured after creation
            </Typography>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleCreateApplication} variant="contained">
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </>
  );
};

export default ApplicationsDashboard;

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  OutlinedInput,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(formData.username, formData.password);

    setLoading(false);

    if (result.success) {
      console.log("success");
      navigate("/applications", { replace: true });
      // const isAdmin = result?.user?.user_groups?.includes("admin");
      // // Redirect to the page they tried to visit or home
      // if (isAdmin) {
      //   navigate("/usermanagement", { replace: true });
      // } else {
      //   navigate("/applications", { replace: true });
      // }
    } else {
      setError(result.error);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    // <Container maxWidth="sm">
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5", // Light gray background
        p: 3,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontSize: "2rem",
            fontWeight: 600,
            color: "#000",
            textAlign: "center",
            mb: 1,
          }}
        >
          Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, width: "100%" }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <TextField
            margin="normal"
            // required
            fullWidth
            id="username"
            // label="Username"
            placeholder="Username"
            name="username"
            // autoComplete="username"
            h
            autoFocus
            value={formData.username}
            onChange={handleChange}
            disabled={loading}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#e8e8e8", // Light gray background
                borderRadius: "25px", // Rounded corners
                "& fieldset": {
                  border: "none", // Remove border
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
              },
              "& .MuiInputBase-input": {
                padding: "16px 20px",
                fontSize: "1rem",
                color: "#333",
                "&::placeholder": {
                  color: "#666",
                  opacity: 1,
                },
              },
            }}
          />

          <TextField
            margin="normal"
            // required
            fullWidth
            name="password"
            // label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            // autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            disabled={loading}
            placeholder="Password"
            variant="outlined"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleTogglePassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#e8e8e8", // Light gray background
                borderRadius: "25px", // Rounded corners
                "& fieldset": {
                  border: "none", // Remove border
                },
                "&:hover fieldset": {
                  border: "none",
                },
                "&.Mui-focused fieldset": {
                  border: "none",
                },
              },
              "& .MuiInputBase-input": {
                padding: "16px 20px",
                fontSize: "1rem",
                color: "#333",
                "&::placeholder": {
                  color: "#666",
                  opacity: 1,
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#666", // Dark gray background
              color: "#fff",
              borderRadius: "25px", // Rounded corners
              padding: "16px",
              fontSize: "1rem",
              fontWeight: 500,
              textTransform: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // Subtle shadow
              "&:hover": {
                backgroundColor: "#555",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              },
              "&:disabled": {
                backgroundColor: "#999",
                color: "#fff",
              },
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </Box>
      </Box>
    </Box>
    // </Container>
  );
};

export default Login;

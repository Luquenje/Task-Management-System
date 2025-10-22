import {
  AppBar,
  Container,
  Toolbar,
  Typography,
  Button,
  Box,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useEffect } from "react";

function NavBar() {
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isUserMgmtPage, setIsUserMgmtPage] = useState(false);
  useEffect(() => {
    setIsUserMgmtPage(false);
    const currentPath = window.location.pathname;
    if (currentPath === "/usermanagement") {
      setIsUserMgmtPage(true);
    }
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  const handleNavToUserManagement = async () => {
    navigate("/usermanagement");
  };
  const handleNavToApplications = async () => {
    navigate("/applications");
  };
  return (
    <>
      {" "}
      <AppBar
        // position="static"
        // elevation={2}
        sx={{ backgroundColor: "#BFBFBF", boxShadow: "0" }}
      >
        <Container maxWidth="90%">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              // component={RouterLink}
              // to="/"
              sx={{
                fontWeight: 700,
                fontSize: "1.5rem",
                color: "inherit",
                textDecoration: "none",
                // "&:hover": {
                //   color: "primary.light",
                // },
                transition: "color 0.3s ease",
              }}
            >Task Management System</Typography>
            <Box>
              {isAdmin &&
                (!isUserMgmtPage ? (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#5E5E5E",
                      height: "32px",
                      borderRadius: "16px",
                      marginX: "16px",
                      "&:hover": {
                        backgroundColor: "#5E5E5E", // Hover color
                      },
                    }}
                    disableElevation
                    onClick={handleNavToUserManagement}
                  >
                    <PersonIcon sx={{ marginRight: "8px" }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 300,
                        fontSize: "0.8rem",
                        color: "inherit",
                        textDecoration: "none",
                        "&:hover": {
                          color: "#ffffffff",
                        },
                        transition: "color 0.3s ease",
                      }}
                    >
                      User Management
                    </Typography>
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: "#5E5E5E",
                      height: "32px",
                      borderRadius: "16px",
                      marginX: "16px",
                      "&:hover": {
                        backgroundColor: "#5E5E5E", // Hover color
                      },
                    }}
                    disableElevation
                    onClick={handleNavToApplications}
                  >
                    <HomeIcon sx={{ marginRight: "8px" }} />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 300,
                        fontSize: "0.8rem",
                        color: "inherit",
                        textDecoration: "none",
                        "&:hover": {
                          color: "#ffffffff",
                        },
                        transition: "color 0.3s ease",
                      }}
                    >
                      Applications
                    </Typography>
                  </Button>
                ))}
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#5E5E5E",
                  height: "32px",
                  borderRadius: "16px",
                  marginX: "16px",
                  "&:hover": {
                    backgroundColor: "#5E5E5E", // Hover color
                  },
                }}
                disableElevation
                onClick={handleLogout}
              >
                <LogoutIcon sx={{ marginRight: "8px" }} />
                <Typography
                  variant="h6"
                  component={RouterLink}
                  to="/"
                  sx={{
                    fontWeight: 300,
                    fontSize: "0.8rem",
                    color: "inherit",
                    textDecoration: "none",
                    "&:hover": {
                      color: "#ffffffff",
                    },
                    transition: "color 0.3s ease",
                  }}
                >
                  Logout
                </Typography>
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </>
  );
}

export default NavBar;

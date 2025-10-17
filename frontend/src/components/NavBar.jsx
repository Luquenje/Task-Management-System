import { AppBar, Container, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { Link as RouterLink, useNavigate } from "react-router-dom";

function NavBar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };
  return (
    <>
      {" "}
      <AppBar position="static" elevation={2}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: "space-between" }}>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              sx={{
                fontWeight: 700,
                fontSize: "1.5rem",
                color: "inherit",
                textDecoration: "none",
                "&:hover": {
                  color: "primary.light",
                },
                transition: "color 0.3s ease",
              }}
            >
              TMS
            </Typography>
            <Button variant="contained" disableElevation onClick={handleLogout}>
              logout
            </Button>
          </Toolbar>
        </Container>
      </AppBar>
    </>
  );
}

export default NavBar;

import { Container } from "@mui/material";
import NavBar from "../components/NavBar";

const ApplicationsDashboard = () => {
  return (
    <>
      <NavBar />
      <Container maxWidth="sm" sx={{ mt: 10 }}>
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
          help
        </Container>
      </Container>
    </>
  );
};

export default ApplicationsDashboard;

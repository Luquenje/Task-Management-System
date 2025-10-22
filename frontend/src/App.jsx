import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import { AuthProvider } from "./contexts/AuthContext";
// import Navbar from './components/Navbar'
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
// import About from './pages/About'
// import Login from './pages/Login'
import UserManagementDashboard from "./pages/UserManagement";
import ApplicationsDashboard from "./pages/ApplicationsDashboard";
import KanbanBoard from "./pages/KanbanBoard";

import "./App.css";

function Default() {
  const [count, setCount] = useState(0);
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

function App() {
  return (
    <>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <div className="App">
            {/* <Navbar /> */}
            <Routes>
              {/* <Route path="/login" element={<Login />} /> */}
              {/* <Route path="/about" element={<About />} /> */}
              <Route
                path="/"
                element={
                  // <ProtectedRoute>
                  <Home />
                  // </ProtectedRoute>
                }
              />
              <Route
                path="/usermanagement"
                element={
                  <ProtectedRoute requireAdmin>
                    <UserManagementDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <ApplicationsDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:acronym/kanban"
                element={
                  <ProtectedRoute>
                    <KanbanBoard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </>
  );
}

export default App;

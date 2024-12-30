import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
  NavLink,
} from "react-router-dom";
import { LicenseProvider } from "./LicenseContext";
import { useLicense } from "./useLicense";
import Home from "./components/home";
import Xls from "./components/xls";
import Xml from "./components/xml";
import Speed from "./components/speed";
import License from "./components/license";
import "./App.css";

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { hasValidLicense } = useLicense();
  return hasValidLicense ? children : <Navigate to="/license" replace />;
};

const AppContent = () => {
  const { hasValidLicense } = useLicense();
  const navigate = useNavigate();

  useEffect(() => {
    if (!hasValidLicense) {
      navigate("/license", { replace: true }); // Redireciona para a página de licença
    }
  }, [hasValidLicense, navigate]);

  return (
    <div className="main-layout">
      {/* Sidebar visível apenas se a licença for válida */}
      {hasValidLicense && (
        <div className="sidebar">
          <h2 className="sidebar-title">Menu</h2>
          <nav>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/xls"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              XLS
            </NavLink>
            <NavLink
              to="/xml"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              XML
            </NavLink>
            <NavLink
              to="/speed"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              TXT
            </NavLink>
          </nav>
        </div>
      )}
      <div className="content">
        <Routes>
          <Route path="/license" element={<License />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/xls"
            element={
              <ProtectedRoute>
                <Xls />
              </ProtectedRoute>
            }
          />
          <Route
            path="/xml"
            element={
              <ProtectedRoute>
                <Xml />
              </ProtectedRoute>
            }
          />
          <Route
            path="/speed"
            element={
              <ProtectedRoute>
                <Speed />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <LicenseProvider>
      <Router>
        <AppContent />
      </Router>
    </LicenseProvider>
  );
};

export default App;

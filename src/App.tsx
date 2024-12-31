import React, { useEffect, useState } from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate,
  NavLink,
  useLocation,
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
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const response = await window.pyloid.LicenseStorageAPI.load_license();
        if (response.success && response.data.licenseValidation) {
          const expirationDate = new Date(response.data.licenseValidation);
          const today = new Date();
          if (expirationDate < today) {
            setIsLicenseExpired(true); // Marca a licença como expirada
          }
        }
      } catch (error) {
        console.error("Erro ao verificar a licença:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLicense();
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (isLicenseExpired) {
    return (
      <div className="expired-license">
        <h1>Sua licença expirou</h1>
        <p>Por favor, entre em contato com o administrador do sistema.</p>
      </div>
    );
  }

  return hasValidLicense ? children : <Navigate to="/license" replace />;
};

const AppContent = () => {
  const { hasValidLicense } = useLicense();
  const navigate = useNavigate();
  const location = useLocation(); // Para verificar a rota atual
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [logoPath, setLogoPath] = useState("");

  useEffect(() => {
    const fetchLogoPath = async () => {
      try {
        const isProd = await window.pyloid.CustomAPI.is_production();
        console.log("Ambiente de produção:", isProd);
  
        const productionPath = isProd ? await window.pyloid.CustomAPI.get_production_path() : null;
        const path = productionPath
          ? `${productionPath}/icons/icon.png`
          : "src-pyloid/icons/icon.png";
  
        console.log("Caminho da imagem:", path);
  
        // Testa se a imagem existe antes de definir
        const response = await fetch(path);
        if (response.ok) {
          setLogoPath(path);
        } else {
          console.error("Imagem não encontrada:", path);
          setLogoPath("src-pyloid/icons/icon.png"); // Fallback
        }
      } catch (error) {
        console.error("Erro ao verificar o ambiente ou carregar a imagem:", error);
        setLogoPath("src-pyloid/icons/icon.png"); // Fallback
      }
    };
  
    fetchLogoPath();
  }, []);
  

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const response = await window.pyloid.LicenseStorageAPI.load_license();
        if (response.success && response.data.licenseValidation) {
          const expirationDate = new Date(response.data.licenseValidation);
          const today = new Date();
          if (expirationDate < today) {
            setIsLicenseExpired(true); // Marca a licença como expirada
          }
        }
      } catch (error) {
        console.error("Erro ao verificar a licença:", error);
      }
    };

    checkLicense();
  }, []);

  useEffect(() => {
    if (!hasValidLicense && !isLicenseExpired) {
      navigate("/license", { replace: true }); // Redireciona para a página de licença
    }
  }, [hasValidLicense, navigate, isLicenseExpired]);

  // Verifica se a rota atual é '/license'
  const isLicensePage = location.pathname === "/license";

  return (
    <div className="main-layout">
      {/* Sidebar visível apenas se a licença for válida e a página não for a de licença */}
      {!isLicensePage && hasValidLicense && !isLicenseExpired && (
        <div className="sidebar">
          <img
            src={logoPath} // Caminho dinâmico da imagem
            alt="Logo da Empresa"
            className="sidebar-logo"
          />
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
        {isLicenseExpired ? (
          <div className="expired-license">
            <h1>Sua licença expirou</h1>
            <p>Por favor, entre em contato com o administrador do sistema.</p>
          </div>
        ) : (
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
        )}
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

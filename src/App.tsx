import { useContext, useEffect, useState } from "react";
import {
  HashRouter as Router,
  Route,
  Routes,
  NavLink,
  useNavigate,
} from "react-router-dom";
import LicenseContext, { LicenseProvider } from "./LicenseContext";
import Home from "./components/home";
import Xls from "./components/xls";
import Xml from "./components/xml";
import Speed from "./components/speed";
import License from "./components/license";
import "./App.css";

const AppContent = () => {
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Adicionado estado de carregamento
  const navigate = useNavigate();
  const { hasValidLicense, setHasValidLicense } = useContext(LicenseContext)!;
  console.log("isLicenseExpired", isLicenseExpired);
  useEffect(() => {
    const checkLicense = async () => {
      try {
        const response = await window.pyloid.LicenseStorageAPI.load_license();
        if (response.success && response.data.licenseValidation) {
          const expirationDate = new Date(response.data.licenseValidation);
          const today = new Date();

          if (expirationDate >= today) {
            setHasValidLicense(true); // Licença válida
          } else {
            setIsLicenseExpired(true); // Licença expirada
            setHasValidLicense(false);
          }
        } else {
          setHasValidLicense(false); // Licença inválida ou não encontrada
        }
      } catch (error) {
        console.error("Erro ao verificar a licença:", error);
        setHasValidLicense(false);
      } finally {
        setIsLoading(false); // Conclui o carregamento
      }
    };

    checkLicense();
  });

  useEffect(() => {
    if (!isLoading && !hasValidLicense) {
      // Redireciona para /license se a licença não for válida
      navigate("/license", { replace: true });
    }
  }, [isLoading, hasValidLicense, navigate]);

  if (isLoading) {
    return <div>Carregando...</div>; // Mostra um estado de carregamento enquanto verifica a licença
  }

  return (
    <div className="main-layout">
      {hasValidLicense && (
        <div className="sidebar">
          <nav>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              Início
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
          <Route path="/" element={<Home />} />
          <Route path="/xls" element={<Xls />} />
          <Route path="/xml" element={<Xml />} />
          <Route path="/speed" element={<Speed />} />
          <Route path="*" element={<Home />} />
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

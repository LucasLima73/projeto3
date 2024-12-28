import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Container, Nav } from "react-bootstrap";
import {
  FaHome,
  FaFileExcel,
  FaFileAlt,
  FaTachometerAlt,
} from "react-icons/fa";
import "./App.css";
import Home from "./components/home";
import Xls from "./components/xls";
import Xml from "./components/xml";
import Speed from "./components/speed";
import License from "./components/license";

const App = () => {
  const [isLicenseValid, setIsLicenseValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Recuperar a data de expiração da licença do localStorage
    const expirationDate = localStorage.getItem("licenseExpirationDate");

    if (expirationDate) {
      const today = new Date();
      const expiration = new Date(expirationDate);

      // Verificar se a licença está válida
      if (expiration >= today) {
        setIsLicenseValid(true); // Licença válida
      } else {
        setIsLicenseValid(false); // Licença expirada
      }
    } else {
      setIsLicenseValid(false); // Licença não existe
    }
  }, []);

  // Renderizar somente a tela de licença enquanto validação não é concluída
  if (isLicenseValid === null) {
    return <div>Carregando...</div>; // Exibir carregamento enquanto verifica a licença
  }

  // Renderizar a tela de licença diretamente se a licença for inválida
  if (!isLicenseValid) {
    return (
      <Router>
        <License />
      </Router>
    );
  }

  // Renderizar o app normalmente se a licença for válida
  return (
    <Router>
      <div className="main-layout">
        {/* Barra Lateral */}
        <div className="sidebar">
          <h2 className="sidebar-title">Menu</h2>
          <Nav className="flex-column">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <FaHome className="nav-icon" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/xls"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <FaFileExcel className="nav-icon" />
              <span>XLS</span>
            </NavLink>
            <NavLink
              to="/xml"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <FaFileAlt className="nav-icon" />
              <span>XML</span>
            </NavLink>
            <NavLink
              to="/speed"
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <FaTachometerAlt className="nav-icon" />
              <span>TXT</span>
            </NavLink>
          </Nav>
        </div>
        {/* Conteúdo Principal */}
        <div className="content">
          <Container>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/speed" element={<Speed />} />
              <Route path="/xml" element={<Xml />} />
              <Route path="/xls" element={<Xls />} />
            </Routes>
          </Container>
        </div>
      </div>
    </Router>
  );
};

export default App;

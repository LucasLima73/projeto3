import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Container, Nav } from "react-bootstrap";
import { FaHome, FaFileExcel, FaFileAlt, FaTachometerAlt } from "react-icons/fa";
import "./App.css";
import Home from "./components/home";
import Xls from "./components/xls";
import Xml from "./components/xml";
import Speed from "./components/speed";

const App = () => {
  return (
    <Router>
      <div className="main-layout">
        {/* Barra Lateral */}
        <div className="sidebar">
          <h2 className="sidebar-title">Menu</h2>
          <Nav className="flex-column">
            <NavLink
              to="/"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <FaHome className="nav-icon" />
              <span>Home</span>
            </NavLink>
            <NavLink
              to="/xls"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <FaFileExcel className="nav-icon" />
              <span>XLS</span>
            </NavLink>
            <NavLink
              to="/xml"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
            >
              <FaFileAlt className="nav-icon" />
              <span>XML</span>
            </NavLink>
            <NavLink
              to="/speed"
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
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

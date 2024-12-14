import { Link } from "react-router-dom";
import "./index.css";

const NavBar = () => {
  return (
    <div className="navbar">
      <div className="navbar-logo">
        <h2>Logo</h2>
      </div>
      <ul className="navbar-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/services">Services</Link></li>
        <li><Link to="/contact">Contact</Link></li>
      </ul>
    </div>
  );
};

export default NavBar;

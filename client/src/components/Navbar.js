import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles.css";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      onLogout();
      navigate("/");
    }
  };

  return (
    <nav className="navbar glass-card fade-in">
      <div className="nav-left">
        <h2 className="nav-title gradient-text">🎓 Student Information Portal</h2>
        {user && (
          <span className="roll-display">
            Roll No: <strong>{user.roll_number}</strong>
          </span>
        )}
      </div>

      <div className="nav-right">
        {user ? (
          <>
            <Link to="/home" className="nav-link">Home</Link>
            <Link to="/student" className="nav-link">Student</Link>
            <Link to="/about" className="nav-link">About</Link>
            <button className="btn-logout" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/register" className="nav-link">Register</Link>
            <Link to="/login" className="nav-link">Login</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="landing-container fade-in">
      <div className="landing-content glass-card">
        <h1 className="portal-title gradient-text">Student Information Portal</h1>
        <p className="portal-tagline">
         Welcome to the Student Information Portal, where students can securely view their personal, academic, and course-related information anytime, anywhere.
        </p>
        <div className="landing-buttons">
          <button className="btn-primary" onClick={() => navigate("/register")}>
             Get Started
          </button>
          <button className="btn-secondary" onClick={() => navigate("/login")}>
             Log In
          </button>
        </div>
      </div>

      {/* <div className="landing-footer">
        <p>
          Learn more about our features on the{" "}
          <a href="/about" className="footer-link">About</a> page.
        </p>
      </div> */}
    </div>
  );
};

export default LandingPage;

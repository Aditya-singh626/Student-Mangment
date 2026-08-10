import React from "react";
import "../styles.css";

const About = ({ user }) => {
  if (!user) {
    return (
      <div className="center-message">
        <h2>Please log in to view this page.</h2>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="card glass-card">
        <h2 className="page-title gradient-text"> About the Student</h2>
        <p className="about-text">
          {user.about
            ? user.about
            : "No personal information available. Please update your details in registration."}
        </p>
      </div>
    </div>
  );
};

export default About;

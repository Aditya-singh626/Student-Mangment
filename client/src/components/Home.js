import React from "react";
import "../styles.css";

const Home = ({ user }) => {
  if (!user) {
    return (
      <div className="center-message">
        <h2>Please log in to view student details.</h2>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">
      <div className="card glass-card">
        <h2 className="page-title gradient-text">🏫 Student Basic Information</h2>
        <div className="info-grid">
          <div><strong>Name:</strong> <span>{user.name}</span></div>
          <div><strong>Roll Number:</strong> <span>{user.roll_number}</span></div>
          <div><strong>Course:</strong> <span>{user.course}</span></div>
          <div><strong>Email:</strong> <span>{user.email}</span></div>
          <div><strong>Subjects:</strong> <span>{user.subjects}</span></div>
        </div>
      </div>
    </div>
  );
};

export default Home;

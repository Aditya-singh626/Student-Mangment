import React, { useEffect, useState } from "react";
import "../styles.css";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:4000/api";

const Student = ({ user }) => {
  const [subjects, setSubjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧠 Fetch both subjects & activities for the logged-in user
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const rollNumber = user.roll_number;
        const token = localStorage.getItem("token");

        // Fetch subjects and activities created for that specific student
        const [subRes, actRes] = await Promise.all([
          fetch(`${API_URL}/24UADS1073/subjects/${rollNumber}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/24UADS1073/activities/${rollNumber}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (subRes.ok) {
          const subData = await subRes.json();
          setSubjects(subData);
        }

        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData);
        }
      } catch (err) {
        console.error("❌ Error fetching student data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 🕓 Loading state
  if (loading) {
    return (
      <div className="center-message fade-in">
        <h2>Loading your details...</h2>
      </div>
    );
  }

  // 🚫 No user logged in
  if (!user) {
    return (
      <div className="center-message fade-in">
        <h2>Please log in to view your student details.</h2>
      </div>
    );
  }

  // 🎨 Status badge styling
  const getStatusBadge = (status) => {
    const statusClass =
      status === "done"
        ? "status-done"
        : status === "in-progress"
        ? "status-in-progress"
        : "status-pending";

    const emoji =
      status === "done" ? "✅" : status === "in-progress" ? "🕓" : "⏳";

    return (
      <span className={`status-badge ${statusClass}`}>
        {emoji} {status}
      </span>
    );
  };

  return (
    <div className="page-container fade-in">
      <div className="card glass-card">
        <h2 className="page-title gradient-text">🎓 Student Education Details</h2>

        {/* Basic Info Section */}
        <div className="info-grid">
          
          <div><strong>12th Percentage:</strong> {user.twelfth_percentage || "N/A"}</div>
          <div><strong>City:</strong> {user.city || "N/A"}</div>
          <div><strong>School:</strong> {user.school || "N/A"}</div>
          <div><strong>Year of Passing:</strong> {user.year_of_passing || "N/A"}</div>
        </div>

        {/* Subjects Section */}
        <div className="section">
          <h3 className="section-title gradient-text">📘 Subjects</h3>
          <div className="info-grid">
            {subjects.length > 0 ? (
              subjects.map((subj) => (
                <div key={subj.id} className="subject-card glass-card fade-in">
                  <strong>{subj.subject_name}</strong>
                  <p>{subj.description}</p>
                  <small><em>Course ID: {subj.course_id}</em></small>
                </div>
              ))
            ) : (
              <p>No subjects found for your record.</p>
            )}
          </div>
        </div>

        {/* Activities Section */}
        <div className="section">
          <h3 className="section-title gradient-text">📅 Activities</h3>
          <div className="info-grid">
            {activities.length > 0 ? (
              activities.map((act) => (
                <div key={act.id} className="activity-card glass-card fade-in">
                  <strong>{act.title}</strong>
                  <p>{act.description}</p>
                  <p>Status: {getStatusBadge(act.status)}</p>
                  <p><small>📅 {new Date(act.date).toLocaleDateString()}</small></p>
                </div>
              ))
            ) : (
              <p>No activities found for your account.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Student;

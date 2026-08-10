import React from "react";
import "./auth.css";

const ROLES = [
    { key: "student", label: "Student" },
    { key: "faculty", label: "Faculty" },
    { key: "admin", label: "Admin" }
];

const ACCENT_VARS = {
    student: "var(--student)",
    faculty: "var(--faculty)",
    admin: "var(--admin)",
    neutral: "var(--gold)"
};

const ROLE_LABELS = {
    student: "Student",
    faculty: "Faculty",
    admin: "Admin",
    neutral: "Member"
};

function initialsFor(name) {
    if (!name) return "—";
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "—";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
});

/**
 * Shared shell for /login and /register.
 *
 * role          - "student" | "faculty" | "admin" | "neutral", drives the accent color
 * onRoleChange  - pass a handler to make the role tabs interactive (register page).
 *                 omit it to render the tabs as read-only (login page).
 * heading / subheading - copy for the masthead
 * card          - { name, idNumber, idLabel } to populate the live ID card
 * children      - the actual form
 */
export default function AuthLayout({
    role,
    onRoleChange,
    showRoleTabs = true,
    heading,
    subheading,
    card,
    children
}) {
    const accent = ACCENT_VARS[role] || "var(--gold)";
    const roleLabel = ROLE_LABELS[role] || role;

    return (
        <div className="auth-shell">
            <div className="auth-left" style={{ "--accent": accent }}>
                <div className="auth-eyebrow">Academic Registrar</div>
                <h1 className="auth-heading">{heading}</h1>
                <p className="auth-subheading">{subheading}</p>

                {showRoleTabs && (
                    <div className="role-tabs">
                        {ROLES.map((r) => (
                            <button
                                type="button"
                                key={r.key}
                                className={`role-tab ${role === r.key ? "active" : ""}`}
                                onClick={() => onRoleChange && onRoleChange(r.key)}
                                disabled={!onRoleChange}
                                style={
                                    role === r.key
                                        ? { background: accent, borderColor: accent }
                                        : undefined
                                }
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="id-card-wrap">
                    <div className="id-card" style={{ borderTopColor: accent }}>
                        <div className="id-card-top">
                            <div className="id-card-org">
                                Student Management System
                                <span>Identity Record</span>
                            </div>
                            <div
                                className="id-card-role"
                                style={{ background: accent }}
                            >
                                {roleLabel}
                            </div>
                        </div>

                        <div className="id-card-body">
                            <div
                                className="id-card-avatar"
                                style={{ color: accent }}
                            >
                                {initialsFor(card?.name)}
                            </div>
                            <div>
                                <div
                                    className={`id-card-name ${
                                        card?.name ? "" : "placeholder"
                                    }`}
                                >
                                    {card?.name || "Awaiting details"}
                                </div>
                                <div className="id-card-number">
                                    {card?.idLabel || "ID"}:{" "}
                                    {card?.idNumber || "— — — —"}
                                </div>
                            </div>
                        </div>

                        <div className="id-card-foot">
                            <span>Issued {today}</span>
                            <span>Valid while enrolled</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="auth-right" style={{ "--accent": accent }}>
                <div className="auth-form-wrap">{children}</div>
            </div>
        </div>
    );
}
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./auth.css";

export default function DashboardShell({ accent, title, subtitle, children }) {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "var(--parchment)",
                "--accent": accent
            }}
        >
            <header
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "20px 40px",
                    borderBottom: `3px solid ${accent}`,
                    background: "var(--ink)",
                    color: "#f3f6fc"
                }}
            >
                <div>
                    <div style={{ fontFamily: "Fraunces, serif", fontSize: 20 }}>
                        {title}
                    </div>
                    {subtitle && (
                        <div
                            style={{
                                fontFamily: "IBM Plex Mono, monospace",
                                fontSize: 11,
                                letterSpacing: "0.08em",
                                textTransform: "uppercase",
                                color: "rgba(243,246,252,0.55)",
                                marginTop: 4
                            }}
                        >
                            {subtitle}
                        </div>
                    )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 13, opacity: 0.75 }}>
                        {user?.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        style={{
                            fontFamily: "IBM Plex Mono, monospace",
                            fontSize: 12,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            background: "transparent",
                            border: "1px solid rgba(243,246,252,0.3)",
                            color: "#f3f6fc",
                            borderRadius: 999,
                            padding: "8px 14px",
                            cursor: "pointer"
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <main style={{ padding: "32px 40px 60px", fontFamily: "Inter, sans-serif" }}>
                {children}
            </main>
        </div>
    );
}
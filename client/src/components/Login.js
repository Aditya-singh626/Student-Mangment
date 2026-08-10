import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Enter both email and password.");
            return;
        }

        setLoading(true);

        try {
            const user = await login(email, password);
            navigate(`/${user.role}/dashboard`, { replace: true });
        } catch (err) {
            const message =
                err.response?.data?.error ||
                "Could not sign in. Check your credentials and try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout
            role="neutral"
            showRoleTabs={false}
            heading="Welcome back to the registry."
            subheading="Sign in to reach your student, faculty, or admin dashboard. Your role is read from your account automatically."
            card={{ name: "", idLabel: "ID", idNumber: "" }}
        >
            <h2 className="auth-form-title">Sign in</h2>
            <p className="auth-form-switch">
                New here? <Link to="/register">Create an account</Link>
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="you@institute.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>

                <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </AuthLayout>
    );
}
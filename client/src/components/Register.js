import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";

const HEADINGS = {
    student: {
        heading: "Begin your student record.",
        subheading:
            "Register with your roll number to unlock attendance, academic records, and your personal dashboard."
    },
    faculty: {
        heading: "Join the faculty roster.",
        subheading:
            "Register with your employee ID to mark attendance and manage academic records for your students."
    },
    admin: {
        heading: "Set up an admin account.",
        subheading:
            "Admin accounts can manage every student and faculty record across the institute."
    }
};

const initialForm = {
    name: "",
    email: "",
    password: "",
    roll_number: "",
    course: "",
    year: "",
    employee_id: "",
    department: "",
    designation: "",
    phone: ""
};

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [role, setRole] = useState("student");
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function update(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    function handleRoleChange(nextRole) {
        setRole(nextRole);
        setError("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.name || !form.email || !form.password) {
            setError("Name, email and password are required.");
            return;
        }

        if (role === "student" && !form.roll_number) {
            setError("Roll number is required for students.");
            return;
        }

        if (role === "faculty" && !form.employee_id) {
            setError("Employee ID is required for faculty.");
            return;
        }

        const payload = {
            name: form.name,
            email: form.email,
            password: form.password,
            role,
            phone: form.phone || undefined
        };

        if (role === "student") {
            payload.roll_number = form.roll_number;
            payload.course = form.course || undefined;
            payload.year = form.year || undefined;
        }

        if (role === "faculty") {
            payload.employee_id = form.employee_id;
            payload.department = form.department || undefined;
            payload.designation = form.designation || undefined;
        }

        setLoading(true);

        try {
            const user = await register(payload);
            navigate(`/${user.role}/dashboard`, { replace: true });
        } catch (err) {
            const message =
                err.response?.data?.error ||
                "Could not complete registration. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    const copy = HEADINGS[role];
    const cardId =
        role === "student"
            ? { idLabel: "Roll No.", idNumber: form.roll_number }
            : role === "faculty"
            ? { idLabel: "Employee ID", idNumber: form.employee_id }
            : { idLabel: "Access", idNumber: "ADMIN" };

    return (
        <AuthLayout
            role={role}
            onRoleChange={handleRoleChange}
            heading={copy.heading}
            subheading={copy.subheading}
            card={{ name: form.name, ...cardId }}
        >
            <h2 className="auth-form-title">Create your account</h2>
            <p className="auth-form-switch">
                Already registered? <Link to="/login">Sign in</Link>
            </p>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="field">
                    <label htmlFor="name">Full name</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="Jordan Ellis"
                        value={form.name}
                        onChange={update("name")}
                        autoComplete="name"
                    />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="you@institute.edu"
                            value={form.email}
                            onChange={update("email")}
                            autoComplete="email"
                        />
                    </div>

                    <div className="field">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={update("password")}
                            autoComplete="new-password"
                        />
                    </div>
                </div>

                {role === "student" && (
                    <>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="roll_number">Roll number</label>
                                <input
                                    id="roll_number"
                                    type="text"
                                    placeholder="24UADS1073"
                                    value={form.roll_number}
                                    onChange={update("roll_number")}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="year">Year</label>
                                <input
                                    id="year"
                                    type="number"
                                    min="1"
                                    max="6"
                                    placeholder="2"
                                    value={form.year}
                                    onChange={update("year")}
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="course">Course</label>
                            <input
                                id="course"
                                type="text"
                                placeholder="Artificial Intelligence and Data Science"
                                value={form.course}
                                onChange={update("course")}
                            />
                        </div>
                    </>
                )}

                {role === "faculty" && (
                    <>
                        <div className="field-row">
                            <div className="field">
                                <label htmlFor="employee_id">Employee ID</label>
                                <input
                                    id="employee_id"
                                    type="text"
                                    placeholder="EMP-2201"
                                    value={form.employee_id}
                                    onChange={update("employee_id")}
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="designation">Designation</label>
                                <input
                                    id="designation"
                                    type="text"
                                    placeholder="Assistant Professor"
                                    value={form.designation}
                                    onChange={update("designation")}
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="department">Department</label>
                            <input
                                id="department"
                                type="text"
                                placeholder="Computer Science and Engineering"
                                value={form.department}
                                onChange={update("department")}
                            />
                        </div>
                    </>
                )}

                {role === "admin" && (
                    <p className="field-hint">
                        Admin accounts don't need an additional profile — just the
                        details above.
                    </p>
                )}

                <div className="field">
                    <label htmlFor="phone">Phone (optional)</label>
                    <input
                        id="phone"
                        type="tel"
                        placeholder="+91 90000 00000"
                        value={form.phone}
                        onChange={update("phone")}
                        autoComplete="tel"
                    />
                </div>

                <button className="auth-submit" type="submit" disabled={loading}>
                    {loading ? "Creating account…" : `Register as ${role}`}
                </button>
            </form>
        </AuthLayout>
    );
}
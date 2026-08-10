import React, { useEffect, useState, useMemo } from "react";
import DashboardShell from "../../components/DashboardShell";
import Tabs from "../../components/Tabs";
import StatCard from "../../components/StatCard";
import TrendChart from "../../components/TrendChart";
import { useAuth } from "../../context/AuthContext";
import { studentApi, attendanceApi, academicApi } from "../../services/api";
import "../../components/dashboard.css";

const TABS = [
    { key: "overview", label: "Overview" },
    { key: "attendance", label: "Attendance" },
    { key: "academics", label: "Academic Records" },
    { key: "profile", label: "Profile" }
];

const PROFILE_FIELDS = [
    "phone",
    "city",
    "school",
    "tenth_percentage",
    "twelfth_percentage",
    "year_of_passing",
    "about"
];

export default function StudentDashboard() {
    const { user } = useAuth();

    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);
    const [attendance, setAttendance] = useState({ summary: null, records: [] });
    const [academics, setAcademics] = useState({ total_records: 0, records: [] });

    useEffect(() => {
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError("");

            try {
                const [profileRes, attendanceRes, academicsRes] = await Promise.all([
                    studentApi.getProfile(),
                    attendanceApi.getMy(),
                    academicApi.getMy()
                ]);

                if (cancelled) return;

                setProfile(profileRes.data.student);
                setAttendance({
                    summary: attendanceRes.data.summary,
                    records: attendanceRes.data.records || []
                });
                setAcademics({
                    total_records: academicsRes.data.total_records,
                    records: academicsRes.data.records || []
                });
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.error ||
                            "Could not load your dashboard data."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadAll();
        return () => {
            cancelled = true;
        };
    }, []);

    // ---- derived data -------------------------------------------------

    const subjectAttendance = useMemo(() => {
        const groups = {};
        for (const r of attendance.records) {
            const key = r.subject_name || "Unassigned";
            if (!groups[key]) groups[key] = { total: 0, present: 0 };
            groups[key].total += 1;
            if (r.status === "present") groups[key].present += 1;
        }
        return Object.entries(groups)
            .map(([subject, v]) => ({
                subject,
                pct: v.total ? Math.round((v.present / v.total) * 100) : 0
            }))
            .sort((a, b) => b.pct - a.pct);
    }, [attendance.records]);

    const recentAttendance = attendance.records.slice(0, 5);

    const semesterGroups = useMemo(() => {
        const groups = {};
        for (const r of academics.records) {
            if (!groups[r.semester]) groups[r.semester] = [];
            groups[r.semester].push(r);
        }
        return Object.entries(groups)
            .map(([semester, records]) => {
                const avg =
                    records.reduce((sum, r) => sum + Number(r.marks || 0), 0) /
                    records.length;
                return { semester: Number(semester), records, avg };
            })
            .sort((a, b) => a.semester - b.semester);
    }, [academics.records]);

    const overallAvg = useMemo(() => {
        if (academics.records.length === 0) return null;
        const sum = academics.records.reduce(
            (s, r) => s + Number(r.marks || 0),
            0
        );
        return (sum / academics.records.length).toFixed(1);
    }, [academics.records]);

    const recentGrades = useMemo(() => {
        return [...academics.records]
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 5);
    }, [academics.records]);

    const classesToSafeAttendance = useMemo(() => {
        const s = attendance.summary;
        if (!s || s.total === 0) return 0;
        if (s.attendance_percentage >= 75) return 0;
        const needed = (0.75 * s.total - s.present) / 0.25;
        return Math.ceil(Math.max(0, needed));
    }, [attendance.summary]);

    if (loading) {
        return (
            <DashboardShell
                accent="var(--student)"
                title="Student Dashboard"
                subtitle={profile?.roll_number}
            >
                <div className="loading-state">Loading your record…</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            accent="var(--student)"
            title="Student Dashboard"
            subtitle={profile?.roll_number}
        >
            <h1 className="dash-greeting">Welcome back, {user?.name?.split(" ")[0]}.</h1>
            <div className="dash-meta">
                <span>{profile?.course || "Course not set"}</span>
                {profile?.year && <span>Year {profile.year}</span>}
                <span>{profile?.roll_number}</span>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === "overview" && (
                <OverviewTab
                    summary={attendance.summary}
                    overallAvg={overallAvg}
                    totalRecords={academics.total_records}
                    recentAttendance={recentAttendance}
                    recentGrades={recentGrades}
                    classesToSafeAttendance={classesToSafeAttendance}
                />
            )}

            {tab === "attendance" && (
                <AttendanceTab
                    summary={attendance.summary}
                    subjectAttendance={subjectAttendance}
                    records={attendance.records}
                    classesToSafeAttendance={classesToSafeAttendance}
                />
            )}

            {tab === "academics" && (
                <AcademicsTab
                    overallAvg={overallAvg}
                    semesterGroups={semesterGroups}
                    totalRecords={academics.total_records}
                    onPrint={() => window.print()}
                />
            )}

            {tab === "profile" && (
                <ProfileTab profile={profile} onSaved={setProfile} user={user} />
            )}

            {/* Hidden except when printing — see .print-only in dashboard.css */}
            <div className="print-only">
                <h2>{user?.name}</h2>
                <div className="print-meta">
                    {profile?.roll_number} · {profile?.course || "—"}
                    {profile?.year ? ` · Year ${profile.year}` : ""} ·{" "}
                    {user?.email}
                </div>

                <p>
                    <strong>Attendance:</strong>{" "}
                    {attendance.summary
                        ? `${attendance.summary.attendance_percentage}% (${attendance.summary.present}/${attendance.summary.total} classes)`
                        : "No records"}
                    &nbsp;&nbsp;
                    <strong>Overall average:</strong> {overallAvg ?? "—"}
                </p>

                {semesterGroups.map((g) => (
                    <div key={g.semester}>
                        <h3>
                            Semester {g.semester} — average {g.avg.toFixed(1)}
                        </h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Marks</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {g.records.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.subject_name || "—"}</td>
                                        <td>{r.marks}</td>
                                        <td>{r.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        </DashboardShell>
    );
}

// =======================================================================
// Overview
// =======================================================================

function OverviewTab({
    summary,
    overallAvg,
    totalRecords,
    recentAttendance,
    recentGrades,
    classesToSafeAttendance
}) {
    return (
        <>
            {classesToSafeAttendance > 0 && (
                <div className="risk-banner">
                    <span className="risk-banner-text">
                        Your attendance is <strong>{summary.attendance_percentage}%</strong>,
                        below the 75% requirement. Attend the next{" "}
                        <strong>{classesToSafeAttendance}</strong> class
                        {classesToSafeAttendance === 1 ? "" : "es"} in a row to
                        get back on track.
                    </span>
                </div>
            )}

            <div className="stat-grid">
                <StatCard
                    label="Attendance"
                    value={
                        summary ? `${summary.attendance_percentage}%` : "—"
                    }
                    hint={
                        summary
                            ? `${summary.present} present / ${summary.total} classes`
                            : "No records yet"
                    }
                />
                <StatCard
                    label="Average Marks"
                    value={overallAvg ?? "—"}
                    hint={`${totalRecords} academic record${
                        totalRecords === 1 ? "" : "s"
                    }`}
                />
                <StatCard
                    label="Classes Absent"
                    value={summary ? summary.absent : "—"}
                    hint="Across all subjects"
                />
                <StatCard
                    label="Semesters Tracked"
                    value={
                        new Set(recentGrades.map((r) => r.semester)).size || "—"
                    }
                    hint="Based on recorded marks"
                />
            </div>

            <div className="panel-grid">
                <div className="panel">
                    <h3 className="panel-title">Recent attendance</h3>
                    <p className="panel-subtitle">Your last few marked classes.</p>
                    {recentAttendance.length === 0 ? (
                        <div className="empty-state">
                            No attendance has been marked yet.
                        </div>
                    ) : (
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Subject</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAttendance.map((r) => (
                                    <tr key={r.id}>
                                        <td className="mono">
                                            {new Date(r.date).toLocaleDateString()}
                                        </td>
                                        <td>{r.subject_name || "—"}</td>
                                        <td>
                                            <span
                                                className={`badge badge-${r.status}`}
                                            >
                                                {r.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="panel">
                    <h3 className="panel-title">Recent grades</h3>
                    <p className="panel-subtitle">Your most recently entered marks.</p>
                    {recentGrades.length === 0 ? (
                        <div className="empty-state">
                            No academic records have been added yet.
                        </div>
                    ) : (
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Sem</th>
                                    <th>Marks</th>
                                    <th>Grade</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentGrades.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.subject_name || "—"}</td>
                                        <td className="mono">{r.semester}</td>
                                        <td className="mono">{r.marks}</td>
                                        <td>
                                            <span className="badge badge-grade">
                                                {r.grade}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </>
    );
}

// =======================================================================
// Attendance
// =======================================================================

function AttendanceTab({ summary, subjectAttendance, records, classesToSafeAttendance }) {
    return (
        <>
            {classesToSafeAttendance > 0 && (
                <div className="risk-banner">
                    <span className="risk-banner-text">
                        You need <strong>{classesToSafeAttendance}</strong> more
                        consecutive present class
                        {classesToSafeAttendance === 1 ? "" : "es"} to reach 75%
                        attendance.
                    </span>
                </div>
            )}

            <div className="stat-grid">
                <StatCard
                    label="Overall attendance"
                    value={summary ? `${summary.attendance_percentage}%` : "—"}
                />
                <StatCard label="Present" value={summary?.present ?? "—"} />
                <StatCard label="Absent" value={summary?.absent ?? "—"} />
                <StatCard label="Total classes" value={summary?.total ?? "—"} />
            </div>

            <div className="panel">
                <h3 className="panel-title">Attendance by subject</h3>
                <p className="panel-subtitle">
                    Share of classes you've been marked present for, per subject.
                </p>
                {subjectAttendance.length === 0 ? (
                    <div className="empty-state">No attendance records yet.</div>
                ) : (
                    subjectAttendance.map((s) => (
                        <div className="bar-row" key={s.subject}>
                            <div className="bar-subject">{s.subject}</div>
                            <div className="bar-track">
                                <div
                                    className="bar-fill"
                                    style={{ width: `${s.pct}%` }}
                                />
                            </div>
                            <div className="bar-pct">{s.pct}%</div>
                        </div>
                    ))
                )}
            </div>

            <div className="panel">
                <h3 className="panel-title">Full history</h3>
                {records.length === 0 ? (
                    <div className="empty-state">No attendance records yet.</div>
                ) : (
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Subject</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((r) => (
                                <tr key={r.id}>
                                    <td className="mono">
                                        {new Date(r.date).toLocaleDateString()}
                                    </td>
                                    <td>{r.subject_name || "—"}</td>
                                    <td>
                                        <span className={`badge badge-${r.status}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </>
    );
}

// =======================================================================
// Academic Records
// =======================================================================

function AcademicsTab({ overallAvg, semesterGroups, totalRecords, onPrint }) {
    return (
        <>
            <div className="stat-grid">
                <StatCard label="Overall average" value={overallAvg ?? "—"} />
                <StatCard label="Total records" value={totalRecords} />
                <StatCard label="Semesters" value={semesterGroups.length} />
            </div>

            {semesterGroups.length > 1 && (
                <div className="panel">
                    <h3 className="panel-title">Performance trend</h3>
                    <p className="panel-subtitle">
                        Your semester average over time.
                    </p>
                    <TrendChart
                        data={semesterGroups.map((g) => ({
                            semester: g.semester,
                            avg: g.avg
                        }))}
                    />
                </div>
            )}

            <div className="panel">
                <div className="panel-header-row">
                    <h3 className="panel-title">Marks by semester</h3>
                    <button className="btn-ghost" onClick={onPrint} type="button">
                        Print report card
                    </button>
                </div>
                {semesterGroups.length === 0 ? (
                    <div className="empty-state">
                        No academic records have been added yet.
                    </div>
                ) : (
                    semesterGroups.map((g) => (
                        <div className="semester-block" key={g.semester}>
                            <div className="semester-heading">
                                <h4>Semester {g.semester}</h4>
                                <span className="semester-avg">
                                    avg {g.avg.toFixed(1)}
                                </span>
                            </div>
                            <table className="ledger-table">
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Marks</th>
                                        <th>Grade</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {g.records.map((r) => (
                                        <tr key={r.id}>
                                            <td>{r.subject_name || "—"}</td>
                                            <td className="mono">{r.marks}</td>
                                            <td>
                                                <span className="badge badge-grade">
                                                    {r.grade}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}

// =======================================================================
// Profile
// =======================================================================

function ProfileTab({ profile, onSaved, user }) {
    const [form, setForm] = useState(() =>
        Object.fromEntries(PROFILE_FIELDS.map((f) => [f, profile?.[f] ?? ""]))
    );
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setForm(
            Object.fromEntries(PROFILE_FIELDS.map((f) => [f, profile?.[f] ?? ""]))
        );
    }, [profile]);

    function update(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");

        try {
            await studentApi.updateProfile(form);
            onSaved((prev) => ({ ...prev, ...form }));
            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(
                err.response?.data?.error || "Could not update your profile."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="panel" style={{ maxWidth: 640 }}>
            <h3 className="panel-title">Your profile</h3>
            <p className="panel-subtitle">
                Name, email, roll number, and course are managed by the
                registrar. Everything below is yours to keep current.
            </p>

            <div className="field-row">
                <div className="field">
                    <label>Name</label>
                    <input value={user?.name || ""} disabled />
                </div>
                <div className="field">
                    <label>Roll number</label>
                    <input value={profile?.roll_number || ""} disabled />
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="field-row">
                    <div className="field">
                        <label htmlFor="phone">Phone</label>
                        <input
                            id="phone"
                            value={form.phone}
                            onChange={update("phone")}
                            placeholder="+91 90000 00000"
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="city">City</label>
                        <input
                            id="city"
                            value={form.city}
                            onChange={update("city")}
                            placeholder="Jodhpur"
                        />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="school">School</label>
                    <input
                        id="school"
                        value={form.school}
                        onChange={update("school")}
                        placeholder="Your previous school"
                    />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label htmlFor="tenth">10th %</label>
                        <input
                            id="tenth"
                            type="number"
                            step="0.01"
                            value={form.tenth_percentage}
                            onChange={update("tenth_percentage")}
                        />
                    </div>
                    <div className="field">
                        <label htmlFor="twelfth">12th %</label>
                        <input
                            id="twelfth"
                            type="number"
                            step="0.01"
                            value={form.twelfth_percentage}
                            onChange={update("twelfth_percentage")}
                        />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="year_of_passing">Year of passing (12th)</label>
                    <input
                        id="year_of_passing"
                        value={form.year_of_passing}
                        onChange={update("year_of_passing")}
                        placeholder="2023"
                    />
                </div>

                <div className="field">
                    <label htmlFor="about">About</label>
                    <input
                        id="about"
                        value={form.about}
                        onChange={update("about")}
                        placeholder="A short line about yourself"
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                    {message && <span className="form-success">{message}</span>}
                </div>
            </form>
        </div>
    );
}
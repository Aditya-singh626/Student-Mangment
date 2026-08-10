import React, { useEffect, useState, useCallback } from "react";
import DashboardShell from "../../components/DashboardShell";
import Tabs from "../../components/Tabs";
import StatCard from "../../components/StatCard";
import { useAuth } from "../../context/AuthContext";
import { facultyApi, attendanceApi, academicApi } from "../../services/api";
import "../../components/dashboard.css";

const TABS = [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Students" },
    { key: "attendance", label: "Attendance" },
    { key: "academics", label: "Academic Records" },
    { key: "profile", label: "Profile" }
];

function errMsg(err, fallback) {
    return err?.response?.data?.error || fallback;
}

export default function FacultyDashboard() {
    const { user } = useAuth();

    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [profile, setProfile] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [dashboard, setDashboard] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadAll() {
            setLoading(true);
            setError("");

            try {
                const [profileRes, dashboardRes] = await Promise.all([
                    facultyApi.getProfile(),
                    facultyApi.getDashboard()
                ]);

                if (cancelled) return;

                setProfile(profileRes.data.faculty);
                setSubjects(profileRes.data.subjects || []);
                setDashboard(dashboardRes.data);
            } catch (err) {
                if (!cancelled) {
                    setError(errMsg(err, "Could not load your dashboard data."));
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

    if (loading) {
        return (
            <DashboardShell
                accent="var(--faculty)"
                title="Faculty Dashboard"
                subtitle={profile?.employee_id}
            >
                <div className="loading-state">Loading your dashboard…</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            accent="var(--faculty)"
            title="Faculty Dashboard"
            subtitle={profile?.employee_id}
        >
            <h1 className="dash-greeting">Welcome, {user?.name?.split(" ")[0]}.</h1>
            <div className="dash-meta">
                <span>{profile?.department || "Department not set"}</span>
                {profile?.designation && <span>{profile.designation}</span>}
                <span>{profile?.employee_id}</span>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === "overview" && (
                <OverviewTab dashboard={dashboard} subjects={subjects} />
            )}

            {tab === "students" && <StudentsTab subjects={subjects} />}

            {tab === "attendance" && <AttendanceTab subjects={subjects} />}

            {tab === "academics" && <AcademicsTab subjects={subjects} />}

            {tab === "profile" && (
                <ProfileTab
                    profile={profile}
                    subjects={subjects}
                    user={user}
                    onSaved={setProfile}
                />
            )}
        </DashboardShell>
    );
}

// =======================================================================
// Overview
// =======================================================================

function OverviewTab({ dashboard, subjects }) {
    const activities = dashboard?.recent_activities || [];

    return (
        <>
            <div className="stat-grid">
                <StatCard
                    label="Subjects assigned"
                    value={dashboard?.total_subjects ?? "—"}
                    hint="Currently teaching"
                />
                <StatCard
                    label="Students"
                    value={dashboard?.total_students ?? "—"}
                    hint="Across your subjects"
                />
                <StatCard
                    label="Attendance marked"
                    value={dashboard?.attendance_records_marked ?? "—"}
                    hint="Total records"
                />
                <StatCard
                    label="Avg. attendance"
                    value={
                        dashboard?.attendance_percentage != null
                            ? `${dashboard.attendance_percentage}%`
                            : "—"
                    }
                    hint="Across your subjects"
                />
            </div>

            <div className="panel-grid">
                <div className="panel">
                    <h3 className="panel-title">Your subjects</h3>
                    <p className="panel-subtitle">
                        Subjects currently assigned to you.
                    </p>
                    {subjects.length === 0 ? (
                        <div className="empty-state">
                            No subjects assigned yet. Contact the admin office.
                        </div>
                    ) : (
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Subject</th>
                                    <th>Semester</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((s) => (
                                    <tr key={s.id}>
                                        <td className="mono">{s.subject_code}</td>
                                        <td>{s.subject_name}</td>
                                        <td className="mono">{s.semester}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="panel">
                    <h3 className="panel-title">Recent activity</h3>
                    <p className="panel-subtitle">
                        Attendance and marks you've recently recorded.
                    </p>
                    {activities.length === 0 ? (
                        <div className="empty-state">No recent activity yet.</div>
                    ) : (
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Activity</th>
                                    <th>Student</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.map((a) => (
                                    <tr key={a.id}>
                                        <td className="mono">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </td>
                                        <td>{a.title}</td>
                                        <td>
                                            {a.student_name
                                                ? `${a.student_name} (${a.roll_number})`
                                                : "—"}
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
// Students
// =======================================================================

function StudentsTab({ subjects }) {
    const [students, setStudents] = useState([]);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {};
            if (search) params.search = search;
            if (subjectFilter) params.subject_id = subjectFilter;
            const res = await facultyApi.getStudents(params);
            setStudents(res.data.students || []);
        } catch (err) {
            setError(errMsg(err, "Could not load students."));
        } finally {
            setLoading(false);
        }
    }, [search, subjectFilter]);

    useEffect(() => {
        const t = setTimeout(load, 250); // debounce search typing
        return () => clearTimeout(t);
    }, [load]);

    return (
        <div className="panel">
            <h3 className="panel-title">Your students</h3>
            <p className="panel-subtitle">
                Students enrolled in the courses you teach.
            </p>

            <div className="field-row" style={{ marginBottom: 18 }}>
                <div className="field">
                    <label htmlFor="student-search">Search</label>
                    <input
                        id="student-search"
                        placeholder="Name or roll number"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="field">
                    <label htmlFor="subject-filter">Subject</label>
                    <select
                        id="subject-filter"
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                        <option value="">All subjects</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.subject_code} — {s.subject_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            {loading ? (
                <div className="loading-state">Loading students…</div>
            ) : students.length === 0 ? (
                <div className="empty-state">No students found.</div>
            ) : (
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>Roll No.</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Course</th>
                            <th>Year</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr key={s.id}>
                                <td className="mono">{s.roll_number}</td>
                                <td>{s.name}</td>
                                <td>{s.email}</td>
                                <td>{s.course || "—"}</td>
                                <td className="mono">{s.year ?? "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// =======================================================================
// Attendance
// =======================================================================

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function AttendanceTab({ subjects }) {
    const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
    const [date, setDate] = useState(todayIso());
    const [roster, setRoster] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [savingId, setSavingId] = useState(null);
    const [message, setMessage] = useState("");

    const loadRoster = useCallback(async () => {
        if (!subjectId) return;
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await attendanceApi.getRoster(subjectId, date);
            setRoster(res.data.roster || []);
        } catch (err) {
            setError(errMsg(err, "Could not load the class roster."));
        } finally {
            setLoading(false);
        }
    }, [subjectId, date]);

    useEffect(() => {
        loadRoster();
    }, [loadRoster]);

    async function markStatus(row, status) {
        setSavingId(row.student_id);
        setError("");
        setMessage("");
        try {
            if (row.attendance_id) {
                await attendanceApi.update(row.attendance_id, { status });
            } else {
                await attendanceApi.mark({
                    student_id: row.student_id,
                    subject_id: Number(subjectId),
                    date,
                    status
                });
            }
            setMessage("Attendance saved.");
            await loadRoster();
        } catch (err) {
            setError(errMsg(err, "Could not save attendance."));
        } finally {
            setSavingId(null);
        }
    }

    if (subjects.length === 0) {
        return (
            <div className="panel">
                <h3 className="panel-title">Attendance</h3>
                <div className="empty-state">
                    You have no assigned subjects yet, so there's nothing to
                    mark attendance for.
                </div>
            </div>
        );
    }

    const presentCount = roster.filter((r) => r.status === "present").length;
    const absentCount = roster.filter((r) => r.status === "absent").length;
    const unmarkedCount = roster.filter((r) => !r.status).length;

    return (
        <>
            <div className="stat-grid">
                <StatCard label="Present" value={presentCount} />
                <StatCard label="Absent" value={absentCount} />
                <StatCard label="Not yet marked" value={unmarkedCount} />
                <StatCard label="Total" value={roster.length} />
            </div>

            <div className="panel">
                <h3 className="panel-title">Mark attendance</h3>
                <p className="panel-subtitle">
                    Select a subject and date, then mark each student.
                </p>

                <div className="field-row" style={{ marginBottom: 18 }}>
                    <div className="field">
                        <label htmlFor="att-subject">Subject</label>
                        <select
                            id="att-subject"
                            value={subjectId}
                            onChange={(e) => setSubjectId(e.target.value)}
                        >
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.subject_code} — {s.subject_name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="field">
                        <label htmlFor="att-date">Date</label>
                        <input
                            id="att-date"
                            type="date"
                            value={date}
                            max={todayIso()}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                </div>

                {error && <div className="auth-error">{error}</div>}
                {message && <span className="form-success">{message}</span>}

                {loading ? (
                    <div className="loading-state">Loading roster…</div>
                ) : roster.length === 0 ? (
                    <div className="empty-state">
                        No students found for this subject's course.
                    </div>
                ) : (
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th>Roll No.</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Mark</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roster.map((r) => (
                                <tr key={r.student_id}>
                                    <td className="mono">{r.roll_number}</td>
                                    <td>{r.student_name}</td>
                                    <td>
                                        {r.status ? (
                                            <span className={`badge badge-${r.status}`}>
                                                {r.status}
                                            </span>
                                        ) : (
                                            <span className="badge">unmarked</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                disabled={savingId === r.student_id}
                                                onClick={() => markStatus(r, "present")}
                                            >
                                                Present
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-primary"
                                                disabled={savingId === r.student_id}
                                                onClick={() => markStatus(r, "absent")}
                                            >
                                                Absent
                                            </button>
                                        </div>
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

function AcademicsTab({ subjects }) {
    const [subjectId, setSubjectId] = useState(subjects[0]?.id || "");
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [drafts, setDrafts] = useState({});
    const [savingId, setSavingId] = useState(null);

    const selectedSubject = subjects.find((s) => String(s.id) === String(subjectId));

    const load = useCallback(async () => {
        if (!subjectId) return;
        setLoading(true);
        setError("");
        setMessage("");
        try {
            const res = await academicApi.getForSubject(subjectId);
            const rows = res.data.records || [];
            setRecords(rows);
            setDrafts(
                Object.fromEntries(
                    rows.map((r) => [
                        r.student_id,
                        { marks: r.marks ?? "", grade: r.grade ?? "" }
                    ])
                )
            );
        } catch (err) {
            setError(errMsg(err, "Could not load academic records."));
        } finally {
            setLoading(false);
        }
    }, [subjectId]);

    useEffect(() => {
        load();
    }, [load]);

    function updateDraft(studentId, field, value) {
        setDrafts((d) => ({
            ...d,
            [studentId]: { ...d[studentId], [field]: value }
        }));
    }

    async function saveRow(row) {
        const draft = drafts[row.student_id] || {};
        const marksNum = Number(draft.marks);

        if (draft.marks === "" || Number.isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
            setError("Marks must be a number between 0 and 100.");
            return;
        }
        if (!draft.grade) {
            setError("Grade is required.");
            return;
        }

        setSavingId(row.student_id);
        setError("");
        setMessage("");

        try {
            if (row.id) {
                await academicApi.update(row.id, {
                    marks: marksNum,
                    grade: draft.grade
                });
            } else {
                await academicApi.add({
                    student_id: row.student_id,
                    subject_id: Number(subjectId),
                    semester: selectedSubject?.semester,
                    marks: marksNum,
                    grade: draft.grade
                });
            }
            setMessage("Marks saved.");
            await load();
        } catch (err) {
            setError(errMsg(err, "Could not save marks."));
        } finally {
            setSavingId(null);
        }
    }

    if (subjects.length === 0) {
        return (
            <div className="panel">
                <h3 className="panel-title">Academic records</h3>
                <div className="empty-state">
                    You have no assigned subjects yet, so there are no marks
                    to manage.
                </div>
            </div>
        );
    }

    return (
        <div className="panel">
            <h3 className="panel-title">Enter / update marks</h3>
            <p className="panel-subtitle">
                Select a subject to view and update marks for every enrolled
                student.
            </p>

            <div className="field-row" style={{ marginBottom: 18 }}>
                <div className="field">
                    <label htmlFor="ac-subject">Subject</label>
                    <select
                        id="ac-subject"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.subject_code} — {s.subject_name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}
            {message && <span className="form-success">{message}</span>}

            {loading ? (
                <div className="loading-state">Loading records…</div>
            ) : records.length === 0 ? (
                <div className="empty-state">
                    No students found for this subject's course.
                </div>
            ) : (
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>Roll No.</th>
                            <th>Name</th>
                            <th>Marks</th>
                            <th>Grade</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {records.map((r) => (
                            <tr key={r.student_id}>
                                <td className="mono">{r.roll_number}</td>
                                <td>{r.student_name}</td>
                                <td>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        style={{ width: 80 }}
                                        value={drafts[r.student_id]?.marks ?? ""}
                                        onChange={(e) =>
                                            updateDraft(r.student_id, "marks", e.target.value)
                                        }
                                    />
                                </td>
                                <td>
                                    <input
                                        type="text"
                                        style={{ width: 60 }}
                                        maxLength={5}
                                        value={drafts[r.student_id]?.grade ?? ""}
                                        onChange={(e) =>
                                            updateDraft(
                                                r.student_id,
                                                "grade",
                                                e.target.value.toUpperCase()
                                            )
                                        }
                                    />
                                </td>
                                <td>
                                    <button
                                        type="button"
                                        className="btn-primary"
                                        disabled={savingId === r.student_id}
                                        onClick={() => saveRow(r)}
                                    >
                                        {savingId === r.student_id ? "Saving…" : "Save"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

// =======================================================================
// Profile
// =======================================================================

function ProfileTab({ profile, subjects, user, onSaved }) {
    const [form, setForm] = useState({
        phone: profile?.phone || "",
        department: profile?.department || "",
        designation: profile?.designation || ""
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        setForm({
            phone: profile?.phone || "",
            department: profile?.department || "",
            designation: profile?.designation || ""
        });
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
            await facultyApi.updateProfile(form);
            onSaved((prev) => ({ ...prev, ...form }));
            setMessage("Profile updated successfully.");
        } catch (err) {
            setError(errMsg(err, "Could not update your profile."));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="panel" style={{ maxWidth: 640 }}>
            <h3 className="panel-title">Your profile</h3>
            <p className="panel-subtitle">
                Name, email, and employee ID are managed by the registrar.
                Everything below is yours to keep current.
            </p>

            <div className="field-row">
                <div className="field">
                    <label>Name</label>
                    <input value={user?.name || ""} disabled />
                </div>
                <div className="field">
                    <label>Employee ID</label>
                    <input value={profile?.employee_id || ""} disabled />
                </div>
            </div>

            <div className="field-row">
                <div className="field">
                    <label>Email</label>
                    <input value={user?.email || ""} disabled />
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
                        <label htmlFor="department">Department</label>
                        <input
                            id="department"
                            value={form.department}
                            onChange={update("department")}
                            placeholder="Computer Science"
                        />
                    </div>
                </div>

                <div className="field">
                    <label htmlFor="designation">Designation</label>
                    <input
                        id="designation"
                        value={form.designation}
                        onChange={update("designation")}
                        placeholder="Assistant Professor"
                    />
                </div>

                <div className="form-actions">
                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Save changes"}
                    </button>
                    {message && <span className="form-success">{message}</span>}
                </div>
            </form>

            <h3 className="panel-title" style={{ marginTop: 28 }}>
                Assigned subjects
            </h3>
            {subjects.length === 0 ? (
                <div className="empty-state">No subjects assigned yet.</div>
            ) : (
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>Code</th>
                            <th>Subject</th>
                            <th>Semester</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map((s) => (
                            <tr key={s.id}>
                                <td className="mono">{s.subject_code}</td>
                                <td>{s.subject_name}</td>
                                <td className="mono">{s.semester}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

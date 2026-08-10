import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import {
    adminStudentApi,
    adminAttendanceApi,
    adminAcademicApi,
    attendanceApi,
    academicApi
} from "../services/api";

const EDITABLE_FIELDS = [
    "phone",
    "city",
    "school",
    "course",
    "year",
    "tenth_percentage",
    "twelfth_percentage",
    "year_of_passing",
    "about"
];

const INNER_TABS = [
    { key: "profile", label: "Profile" },
    { key: "attendance", label: "Attendance" },
    { key: "academics", label: "Academics" }
];

export default function StudentDetailPanel({ studentId, onClose, onUpdated, onDeleted }) {
    const [tab, setTab] = useState("profile");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [student, setStudent] = useState(null);
    const [attendance, setAttendance] = useState({ summary: null, records: [] });
    const [academics, setAcademics] = useState({ total_records: 0, records: [] });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const [studentRes, attendanceRes, academicsRes] = await Promise.all([
                    adminStudentApi.get(studentId),
                    adminAttendanceApi.getForStudent(studentId),
                    adminAcademicApi.getForStudent(studentId)
                ]);
                if (cancelled) return;
                setStudent(studentRes.data.student);
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
                        err.response?.data?.error || "Could not load this student."
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [studentId]);

    return (
        <Modal
            title={student?.name || "Student record"}
            subtitle={student ? `${student.roll_number} · ${student.email}` : ""}
            onClose={onClose}
            wide
        >
            {loading ? (
                <div className="loading-state">Loading student record…</div>
            ) : error ? (
                <div className="auth-error">{error}</div>
            ) : (
                <>
                    <div className="inner-tabs">
                        {INNER_TABS.map((t) => (
                            <button
                                key={t.key}
                                type="button"
                                className={`inner-tab ${tab === t.key ? "active" : ""}`}
                                onClick={() => setTab(t.key)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "profile" && (
                        <ProfileSection
                            student={student}
                            onUpdated={(updated) => {
                                setStudent((s) => ({ ...s, ...updated }));
                                onUpdated && onUpdated(studentId, updated);
                            }}
                            onDeleted={() => onDeleted && onDeleted(studentId)}
                        />
                    )}

                    {tab === "attendance" && (
                        <AttendanceSection
                            studentId={studentId}
                            attendance={attendance}
                            onMarked={(record) =>
                                setAttendance((a) => ({
                                    summary: a.summary,
                                    records: [record, ...a.records]
                                }))
                            }
                        />
                    )}

                    {tab === "academics" && (
                        <AcademicsSection
                            studentId={studentId}
                            academics={academics}
                            onAdded={(record) =>
                                setAcademics((a) => ({
                                    total_records: a.total_records + 1,
                                    records: [record, ...a.records]
                                }))
                            }
                        />
                    )}
                </>
            )}
        </Modal>
    );
}

// =======================================================================
// Profile
// =======================================================================

function ProfileSection({ student, onUpdated, onDeleted }) {
    const [form, setForm] = useState(() =>
        Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, student?.[f] ?? ""]))
    );
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    function update(field) {
        return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            await adminStudentApi.update(student.id, form);
            onUpdated(form);
            setMessage("Profile updated.");
        } catch (err) {
            setError(err.response?.data?.error || "Could not save changes.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        const confirmed = window.confirm(
            `Permanently delete ${student.name}'s account? This cannot be undone.`
        );
        if (!confirmed) return;

        setDeleting(true);
        setError("");
        try {
            await adminStudentApi.remove(student.id);
            onDeleted();
        } catch (err) {
            setError(err.response?.data?.error || "Could not delete this student.");
            setDeleting(false);
        }
    }

    return (
        <div>
            <div className="kv-grid" style={{ marginBottom: 20 }}>
                <div>
                    <div className="kv-item-label">Name</div>
                    <div className="kv-item-value">{student.name}</div>
                </div>
                <div>
                    <div className="kv-item-label">Email</div>
                    <div className="kv-item-value">{student.email}</div>
                </div>
                <div>
                    <div className="kv-item-label">Roll number</div>
                    <div className="kv-item-value">{student.roll_number}</div>
                </div>
                <div>
                    <div className="kv-item-label">Student ID</div>
                    <div className="kv-item-value mono">#{student.id}</div>
                </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSave}>
                <div className="field-row">
                    <div className="field">
                        <label>Course</label>
                        <input value={form.course} onChange={update("course")} />
                    </div>
                    <div className="field">
                        <label>Year</label>
                        <input
                            type="number"
                            min="1"
                            max="6"
                            value={form.year}
                            onChange={update("year")}
                        />
                    </div>
                </div>

                <div className="field-row">
                    <div className="field">
                        <label>Phone</label>
                        <input value={form.phone} onChange={update("phone")} />
                    </div>
                    <div className="field">
                        <label>City</label>
                        <input value={form.city} onChange={update("city")} />
                    </div>
                </div>

                <div className="field">
                    <label>School</label>
                    <input value={form.school} onChange={update("school")} />
                </div>

                <div className="field-row">
                    <div className="field">
                        <label>10th %</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.tenth_percentage}
                            onChange={update("tenth_percentage")}
                        />
                    </div>
                    <div className="field">
                        <label>12th %</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.twelfth_percentage}
                            onChange={update("twelfth_percentage")}
                        />
                    </div>
                </div>

                <div className="field">
                    <label>Year of passing (12th)</label>
                    <input
                        value={form.year_of_passing}
                        onChange={update("year_of_passing")}
                    />
                </div>

                <div className="field">
                    <label>About</label>
                    <input value={form.about} onChange={update("about")} />
                </div>

                <div className="form-actions" style={{ justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button className="btn-primary" type="submit" disabled={saving}>
                            {saving ? "Saving…" : "Save changes"}
                        </button>
                        {message && <span className="form-success">{message}</span>}
                    </div>

                    <button
                        type="button"
                        className="btn-danger"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? "Deleting…" : "Delete student"}
                    </button>
                </div>
            </form>
        </div>
    );
}

// =======================================================================
// Attendance
// =======================================================================

function AttendanceSection({ studentId, attendance, onMarked }) {
    const [form, setForm] = useState({
        subject_id: "",
        date: new Date().toISOString().slice(0, 10),
        status: "present"
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject_id) {
            setError("Enter a subject ID.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const { data } = await attendanceApi.mark({
                student_id: studentId,
                subject_id: Number(form.subject_id),
                date: form.date,
                status: form.status
            });
            onMarked({
                id: data.attendance_id,
                date: form.date,
                status: form.status,
                subject_id: Number(form.subject_id),
                subject_name: null
            });
            setForm((f) => ({ ...f, subject_id: "" }));
        } catch (err) {
            setError(err.response?.data?.error || "Could not mark attendance.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            {attendance.summary && (
                <div className="stat-grid" style={{ marginBottom: 24 }}>
                    <div className="stat-card">
                        <div className="stat-label">Attendance</div>
                        <div className="stat-value">
                            {attendance.summary.attendance_percentage}%
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Present</div>
                        <div className="stat-value">{attendance.summary.present}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Absent</div>
                        <div className="stat-value">{attendance.summary.absent}</div>
                    </div>
                </div>
            )}

            <div className="panel" style={{ marginBottom: 20 }}>
                <h3 className="panel-title">Mark attendance</h3>
                <p className="panel-subtitle">
                    Subject ID refers to the subject's ID in your subjects table.
                </p>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field-row">
                        <div className="field">
                            <label>Subject ID</label>
                            <input
                                type="number"
                                value={form.subject_id}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, subject_id: e.target.value }))
                                }
                                placeholder="e.g. 3"
                            />
                        </div>
                        <div className="field">
                            <label>Date</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, date: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label>Status</label>
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, status: e.target.value }))
                            }
                        >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                        </select>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? "Marking…" : "Mark attendance"}
                    </button>
                </form>
            </div>

            <table className="ledger-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Subject</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {attendance.records.length === 0 ? (
                        <tr>
                            <td colSpan={3} className="empty-state">
                                No attendance recorded yet.
                            </td>
                        </tr>
                    ) : (
                        attendance.records.map((r) => (
                            <tr key={r.id}>
                                <td className="mono">
                                    {new Date(r.date).toLocaleDateString()}
                                </td>
                                <td>{r.subject_name || `Subject #${r.subject_id}`}</td>
                                <td>
                                    <span className={`badge badge-${r.status}`}>
                                        {r.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}

// =======================================================================
// Academics
// =======================================================================

function AcademicsSection({ studentId, academics, onAdded }) {
    const [form, setForm] = useState({
        subject_id: "",
        semester: "",
        marks: "",
        grade: ""
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        if (!form.subject_id || !form.semester || form.marks === "" || !form.grade) {
            setError("All fields are required.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const { data } = await academicApi.add({
                student_id: studentId,
                subject_id: Number(form.subject_id),
                semester: Number(form.semester),
                marks: Number(form.marks),
                grade: form.grade
            });
            onAdded({
                id: data.record_id,
                semester: Number(form.semester),
                marks: Number(form.marks),
                grade: form.grade,
                subject_id: Number(form.subject_id),
                subject_name: null,
                created_at: new Date().toISOString()
            });
            setForm({ subject_id: "", semester: "", marks: "", grade: "" });
        } catch (err) {
            setError(err.response?.data?.error || "Could not add this record.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div>
            <div className="panel" style={{ marginBottom: 20 }}>
                <h3 className="panel-title">Add academic record</h3>
                {error && <div className="auth-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="field-row">
                        <div className="field">
                            <label>Subject ID</label>
                            <input
                                type="number"
                                value={form.subject_id}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, subject_id: e.target.value }))
                                }
                                placeholder="e.g. 3"
                            />
                        </div>
                        <div className="field">
                            <label>Semester</label>
                            <input
                                type="number"
                                min="1"
                                max="8"
                                value={form.semester}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, semester: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Marks</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={form.marks}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, marks: e.target.value }))
                                }
                            />
                        </div>
                        <div className="field">
                            <label>Grade</label>
                            <input
                                value={form.grade}
                                onChange={(e) =>
                                    setForm((f) => ({ ...f, grade: e.target.value }))
                                }
                                placeholder="A+"
                            />
                        </div>
                    </div>
                    <button className="btn-primary" type="submit" disabled={saving}>
                        {saving ? "Adding…" : "Add record"}
                    </button>
                </form>
            </div>

            <table className="ledger-table">
                <thead>
                    <tr>
                        <th>Sem</th>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {academics.records.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="empty-state">
                                No academic records yet.
                            </td>
                        </tr>
                    ) : (
                        academics.records.map((r) => (
                            <tr key={r.id}>
                                <td className="mono">{r.semester}</td>
                                <td>{r.subject_name || `Subject #${r.subject_id}`}</td>
                                <td className="mono">{r.marks}</td>
                                <td>
                                    <span className="badge badge-grade">{r.grade}</span>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
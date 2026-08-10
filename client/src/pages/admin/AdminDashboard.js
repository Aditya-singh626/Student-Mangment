import React, { useEffect, useState, useMemo } from "react";
import DashboardShell from "../../components/DashboardShell";
import Tabs from "../../components/Tabs";
import StatCard from "../../components/StatCard";
import StudentDetailPanel from "../../components/StudentDetailPanel";
import { useAuth } from "../../context/AuthContext";
import { adminStudentApi } from "../../services/api";
import "../../components/dashboard.css";

const TABS = [
    { key: "overview", label: "Overview" },
    { key: "students", label: "Students" }
];

export default function AdminDashboard() {
    const { user } = useAuth();

    const [tab, setTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [students, setStudents] = useState([]);

    const [search, setSearch] = useState("");
    const [courseFilter, setCourseFilter] = useState("all");
    const [yearFilter, setYearFilter] = useState("all");
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const { data } = await adminStudentApi.list();
                if (!cancelled) setStudents(data.students || []);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.error || "Could not load students."
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
    }, []);

    const courses = useMemo(() => {
        const set = new Set(students.map((s) => s.course).filter(Boolean));
        return Array.from(set).sort();
    }, [students]);

    const years = useMemo(() => {
        const set = new Set(students.map((s) => s.year).filter(Boolean));
        return Array.from(set).sort((a, b) => a - b);
    }, [students]);

    const courseBreakdown = useMemo(() => {
        const groups = {};
        for (const s of students) {
            const key = s.course || "Unassigned";
            groups[key] = (groups[key] || 0) + 1;
        }
        return Object.entries(groups).sort((a, b) => b[1] - a[1]);
    }, [students]);

    const recentStudents = students.slice(0, 6);

    const filteredStudents = useMemo(() => {
        const q = search.trim().toLowerCase();
        return students.filter((s) => {
            const matchesSearch =
                !q ||
                s.name?.toLowerCase().includes(q) ||
                s.email?.toLowerCase().includes(q) ||
                s.roll_number?.toLowerCase().includes(q);
            const matchesCourse =
                courseFilter === "all" || s.course === courseFilter;
            const matchesYear =
                yearFilter === "all" || String(s.year) === yearFilter;
            return matchesSearch && matchesCourse && matchesYear;
        });
    }, [students, search, courseFilter, yearFilter]);

    function handleStudentUpdated(id, patch) {
        setStudents((list) =>
            list.map((s) => (s.id === id ? { ...s, ...patch } : s))
        );
    }

    function handleStudentDeleted(id) {
        setStudents((list) => list.filter((s) => s.id !== id));
        setSelectedId(null);
    }

    if (loading) {
        return (
            <DashboardShell accent="var(--admin)" title="Admin Dashboard">
                <div className="loading-state">Loading institute records…</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            accent="var(--admin)"
            title="Admin Dashboard"
            subtitle={`${students.length} students enrolled`}
        >
            <h1 className="dash-greeting">Welcome, {user?.name?.split(" ")[0]}.</h1>
            <div className="dash-meta">
                <span>Institute-wide administration</span>
                <span>{courses.length} course{courses.length === 1 ? "" : "s"}</span>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <Tabs tabs={TABS} active={tab} onChange={setTab} />

            {tab === "overview" && (
                <OverviewTab
                    totalStudents={students.length}
                    courseBreakdown={courseBreakdown}
                    recentStudents={recentStudents}
                    onSelect={setSelectedId}
                />
            )}

            {tab === "students" && (
                <StudentsTab
                    students={filteredStudents}
                    search={search}
                    onSearch={setSearch}
                    courses={courses}
                    courseFilter={courseFilter}
                    onCourseFilter={setCourseFilter}
                    years={years}
                    yearFilter={yearFilter}
                    onYearFilter={setYearFilter}
                    onSelect={setSelectedId}
                />
            )}

            {selectedId && (
                <StudentDetailPanel
                    studentId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onUpdated={handleStudentUpdated}
                    onDeleted={handleStudentDeleted}
                />
            )}
        </DashboardShell>
    );
}

// =======================================================================
// Overview
// =======================================================================

function OverviewTab({ totalStudents, courseBreakdown, recentStudents, onSelect }) {
    return (
        <>
            <div className="stat-grid">
                <StatCard label="Total students" value={totalStudents} />
                <StatCard label="Courses running" value={courseBreakdown.length} />
                <StatCard
                    label="Largest course"
                    value={courseBreakdown[0]?.[0] || "—"}
                    hint={
                        courseBreakdown[0]
                            ? `${courseBreakdown[0][1]} students`
                            : undefined
                    }
                />
            </div>

            <div className="panel-grid">
                <div className="panel">
                    <h3 className="panel-title">Students by course</h3>
                    <p className="panel-subtitle">Enrollment distribution.</p>
                    {courseBreakdown.length === 0 ? (
                        <div className="empty-state">No students yet.</div>
                    ) : (
                        courseBreakdown.map(([course, count]) => (
                            <div className="bar-row" key={course}>
                                <div className="bar-subject">{course}</div>
                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${Math.round(
                                                (count / totalStudents) * 100
                                            )}%`
                                        }}
                                    />
                                </div>
                                <div className="bar-pct">{count}</div>
                            </div>
                        ))
                    )}
                </div>

                <div className="panel">
                    <h3 className="panel-title">Recently enrolled</h3>
                    <p className="panel-subtitle">Newest student accounts.</p>
                    {recentStudents.length === 0 ? (
                        <div className="empty-state">No students yet.</div>
                    ) : (
                        <table className="ledger-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Roll No.</th>
                                    <th>Course</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentStudents.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="clickable"
                                        onClick={() => onSelect(s.id)}
                                    >
                                        <td>
                                            <span className="table-name">{s.name}</span>
                                            <span className="table-sub">{s.email}</span>
                                        </td>
                                        <td className="mono">{s.roll_number}</td>
                                        <td>{s.course || "—"}</td>
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
// Students directory
// =======================================================================

function StudentsTab({
    students,
    search,
    onSearch,
    courses,
    courseFilter,
    onCourseFilter,
    years,
    yearFilter,
    onYearFilter,
    onSelect
}) {
    return (
        <div className="panel">
            <div className="panel-header-row" style={{ marginBottom: 4 }}>
                <div>
                    <h3 className="panel-title">Student directory</h3>
                    <p className="panel-subtitle">
                        {students.length} student{students.length === 1 ? "" : "s"}{" "}
                        matching your filters.
                    </p>
                </div>
            </div>

            <div className="toolbar">
                <input
                    className="search-input"
                    placeholder="Search by name, email, or roll number…"
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                />
                <select
                    className="filter-select"
                    value={courseFilter}
                    onChange={(e) => onCourseFilter(e.target.value)}
                >
                    <option value="all">All courses</option>
                    {courses.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                <select
                    className="filter-select"
                    value={yearFilter}
                    onChange={(e) => onYearFilter(e.target.value)}
                >
                    <option value="all">All years</option>
                    {years.map((y) => (
                        <option key={y} value={y}>
                            Year {y}
                        </option>
                    ))}
                </select>
            </div>

            {students.length === 0 ? (
                <div className="empty-state">No students match your filters.</div>
            ) : (
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Roll No.</th>
                            <th>Course</th>
                            <th>Year</th>
                            <th>City</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((s) => (
                            <tr
                                key={s.id}
                                className="clickable"
                                onClick={() => onSelect(s.id)}
                            >
                                <td>
                                    <span className="table-name">{s.name}</span>
                                    <span className="table-sub">{s.email}</span>
                                </td>
                                <td className="mono">{s.roll_number}</td>
                                <td>{s.course || "—"}</td>
                                <td className="mono">{s.year || "—"}</td>
                                <td>{s.city || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
import axios from "axios";

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000/api"
});

// Attach the JWT to every request once we have one
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
}

// If we already have a token in storage on page load, attach it immediately
const existingToken = localStorage.getItem("sms_token");
if (existingToken) {
    setAuthToken(existingToken);
}

export const authApi = {
    login: (email, password) =>
        api.post("/auth/login", { email, password }),

    register: (payload) =>
        api.post("/auth/register", payload),

    me: () =>
        api.get("/auth/me")
};

export const studentApi = {
    getProfile: () => api.get("/students/profile"),
    updateProfile: (payload) => api.put("/students/profile", payload)
};

export const attendanceApi = {
    getMy: () => api.get("/attendance/my"),
    getForStudent: (studentId) => api.get(`/attendance/student/${studentId}`),
    getRoster: (subjectId, date) =>
        api.get(`/attendance/subject/${subjectId}`, { params: { date } }),
    mark: (payload) => api.post("/attendance", payload),
    update: (id, payload) => api.put(`/attendance/${id}`, payload)
};

export const academicApi = {
    getMy: () => api.get("/academic-records/my"),
    getForStudent: (studentId) => api.get(`/academic-records/student/${studentId}`),
    getForSubject: (subjectId) => api.get(`/academic-records/subject/${subjectId}`),
    add: (payload) => api.post("/academic-records", payload),
    update: (id, payload) => api.put(`/academic-records/${id}`, payload)
};

export const facultyApi = {
    getProfile: () => api.get("/faculty/profile"),
    updateProfile: (payload) => api.put("/faculty/profile", payload),
    getDashboard: () => api.get("/faculty/dashboard"),
    getSubjects: () => api.get("/faculty/subjects"),
    getStudents: (params) => api.get("/faculty/students", { params }),
    getStudent: (id) => api.get(`/faculty/students/${id}`),
    getActivities: () => api.get("/faculty/activities")
};

export const adminStudentApi = {
    list: () => api.get("/students"),
    get: (id) => api.get(`/students/${id}`),
    update: (id, payload) => api.put(`/students/${id}`, payload),
    remove: (id) => api.delete(`/students/${id}`)
};
 
export const adminAttendanceApi = {
    getForStudent: (id) => api.get(`/attendance/student/${id}`)
};
 
export const adminAcademicApi = {
    getForStudent: (id) => api.get(`/academic-records/student/${id}`)
};
export default api;
# Student Management System

A full-stack Student Management System built with **React.js, Node.js, Express.js, MySQL, and JWT authentication**. The application provides role-based access for **students, faculty, and administrators** and includes modules for student profiles, attendance, academic records, subjects, and authentication.

## Features

### Authentication & Authorization
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Protected frontend routes
- Separate dashboards for students, faculty, and administrators

### Student
- Student registration and login
- View and update profile
- View attendance records
- View academic records
- View subjects

### Faculty
- Faculty dashboard
- View students and student details
- Manage attendance
- Manage academic records
- View subjects and assigned students
- View activity information

### Administrator
- Admin dashboard
- View and search students
- Filter student information
- View student details
- Update student information
- Delete student records

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, React Router, Axios, CSS |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JWT, bcrypt |
| API | RESTful APIs |
| Development | Git, GitHub, VS Code |

## Project Structure

```text
student-management-system/
│
├── client/                    # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── admin/
│       │   ├── faculty/
│       │   └── student/
│       ├── services/
│       └── styles.css
│
├── server/                    # Node.js + Express backend
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── init.sql                   # MySQL database schema
├── .gitignore
└── README.md
```

## Database

The project uses **MySQL** for persistent data storage.

The database schema is provided in:

```text
init.sql
```

Import this file into MySQL before running the application.

## Environment Variables

Create a `.env` file inside the `server` directory and use `server/.env.example` as a reference.

Example:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_management
JWT_SECRET=your_secret_key
PORT=4000
```

**Do not commit your actual `.env` file or database credentials to GitHub.**

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/student-management-system.git
cd student-management-system
```

### 2. Set up MySQL

Create the required database and import:

```text
init.sql
```

Make sure the database name matches the `DB_NAME` value in `server/.env`.

### 3. Install backend dependencies

```bash
cd server
npm install
```

Create the `.env` file using `.env.example`.

### 4. Start the backend

```bash
npm start
```

The backend runs on:

```text
http://localhost:4000
```

### 5. Install frontend dependencies

Open a second terminal:

```bash
cd client
npm install
```

### 6. Start the frontend

```bash
npm start
```

The React application normally runs at:

```text
http://localhost:3000
```

## API Modules

The backend provides RESTful APIs for:

```text
/api/auth
/api/students
/api/faculty
/api/attendance
/api/academic-records
```

Authentication is handled using JWT tokens, while protected endpoints use authentication and role-based middleware.

## Security

- Passwords are hashed using bcrypt.
- JWT tokens are used for authentication.
- Protected endpoints require valid authentication.
- Role-based middleware restricts access to authorized users.
- Sensitive configuration is stored in environment variables.
- `.env` and `node_modules` are excluded using `.gitignore`.

## Future Improvements

- Add DELETE operations for attendance and academic records
- Expand user administration
- Add pagination for large datasets
- Add password reset functionality
- Add automated tests
- Add production deployment configuration
- Add advanced analytics and reporting

## Project Purpose

This project demonstrates practical skills in:

- React.js frontend development
- Node.js and Express.js backend development
- RESTful API design
- MySQL database integration
- JWT authentication
- Role-based authorization
- Modular full-stack architecture

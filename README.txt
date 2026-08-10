# Student Management System

A full-stack Student Management System developed using **React.js, Node.js, Express.js, and MySQL**. The system provides separate functionality for **Students, Faculty, and Administrators** with authentication and role-based access.

## Features

* User authentication
* JWT-based authentication
* Role-based access control
* Student dashboard
* Faculty dashboard
* Admin dashboard
* Student profile management
* Faculty management
* Student management
* Attendance management
* Academic records management
* Grade management
* RESTful API integration
* MySQL database integration
* Protected routes based on user roles

## Tech Stack

### Frontend

* React.js
* JavaScript
* HTML
* CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js
* JSON Web Token (JWT)
* bcrypt

### Database

* MySQL

## Project Structure

```text
student-management-system/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       │   ├── admin/
│       │   ├── faculty/
│       │   └── student/
│       ├── services/
│       ├── App.js
│       └── index.js
│
├── server/
│   ├── middleware/
│   ├── routes/
│   ├── db.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
├── init.sql
│   
│
├── .gitignore
└── README.md
```

## Roles

### Student

* Login
* Access student dashboard
* View student information
* View attendance
* View academic records and grades

### Faculty

* Login
* Access faculty dashboard
* Manage student information
* Manage attendance
* Manage academic records and grades

### Admin

* Login
* Access admin dashboard
* Manage students
* Manage faculty
* Manage system information

## Database

The project uses **MySQL** for storing application data.

The database initialization script is available at:

```text
database/init.sql
```

## Environment Variables

Create a `.env` file inside the `server` directory.

```env
PORT=4000
DB_HOST=localhost
DB_USER=root
DB_PASS=your_mysql_password
DB_NAME=student_management_system
JWT_SECRET=your_jwt_secret
```

The actual `.env` file is not included in the repository.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/student-management-system.git
cd student-management-system
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Environment Variables

Create:

```text
server/.env
```

and add the required MySQL and JWT configuration.

### 4. Setup Database

Import:

```text
database/init.sql
```

into MySQL.

### 5. Start Backend

```bash
cd server
npm start
```

The backend runs on:

```text
http://localhost:4000
```

### 6. Start Frontend

Open another terminal:

```bash
cd client
npm install
npm start
```

The frontend runs on:

```text
http://localhost:3000
```

## Security

* JWT-based authentication
* Password hashing using bcrypt
* Role-based access control
* Protected routes
* Database credentials stored using environment variables



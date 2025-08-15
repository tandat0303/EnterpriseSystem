
# Digital Enterprise Management System
This project is a web-based application developed as part of an internship at **CASUMINA** (Cao Su Mien Nam Industrial Joint Stock Company). The system digitizes internal business processes, focusing on form management, approval workflows, user management, and notifications. It streamlines the handling of various internal forms such as meeting room bookings, payment requests, business trip registrations, salary adjustments, IT equipment requests, and recruitment proposals.

The application supports form creation, submission, multi-level approvals, role-based access control (RBAC), real-time notifications (in-app and email), and activity logging. It was designed to improve operational efficiency by replacing manual paper-based processes with a digital platform.
    


## Author(s)
- [Truong Tan Dat](https://github.com/tandat0303)
## Features
- **Form Management:** Create, edit, delete, and search forms with customizable templates.
- **Approval Workflow:** Automated multi-level approval processes - based on form types, roles, and departments.
- **User Management:** Manage users, departments, roles, and permissions.
- **Notifications:** In-app and email alerts for form submissions, approvals, rejections, and reminders.
- **Activity Logging:** Track system activities for auditing purposes.
- **Dashboard:** Overview of pending approvals, submitted forms, and system status.
- **Settings:** Configure system preferences.
- **Supported Forms:**
    + Meeting Room Registration
    + Payment Proposal
    + Business Trip Registration
    + Salary/Allowance Adjustment
    + IT Equipment Request (Purchase/Repair/Maintenance)
    + Recruitment Request


## Tech Stack
- **Frontend:** React.js (chosen for its component-based architecture, large community, and efficient DOM updates).
- **Backend:** Next.js (for server-side rendering, API routes, and seamless integration with React).
- **Database:** MongoDB (NoSQL for flexible schema to handle diverse form structures and scalable data handling).
- **Authentication:** JWT-based (via API endpoints for login/register).
- **Other Tools:**
  - RESTful APIs for CRUD operations.
  - Potential integrations: Email services (e.g., for notifications).

Comparison of **frontend frameworks** considered (based on performance metrics):
| Framework | Startup Time | Memory Usage | DOM Operations |
|-----------|--------------|--------------|----------------|
| React     | Low          | Moderate     | Efficient (subtree updates) |
| Angular   | Higher       | Higher       | Full tree re-renders |
| Vue       | Low          | Low          | Component-level updates |
| Svelte    | Lowest       | Lowest       | Compile-time optimizations |
| Blazor    | Moderate     | Higher       | WebAssembly-based |


React was selected for its balance of performance, flexibility, and ecosystem support.


## Architecture
- **Overall Structure:** Client-server model with React frontend, Next.js backend APIs, and MongoDB for data storage.
- **Modules:**
    + Form Management Module
    + Form Approval Module
    + Permission Management Module
    + Workflow Processing Module
    + User Management Module

- **Database Entities** (MongoDB Collections):
    + User: Stores user details (name, email, password, roleId, departmentId, status).
    + Role: Defines roles (e.g., Super Admin, CEO, Admin, Department Head, Employee) with permissions.
    + Permission: Granular permissions (e.g., create/read/update/delete for resources).
    + Department: Manages organizational units.
    + FormTemplate: Templates for different form types.
    + FormSubmission: Submitted forms with status and history.
    + Workflow: Approval flows and steps.
    + Notification: In-app/email alerts.
    + AuditLog: System activity logs.
    + Setting: System configurations.

**ERD** (Entity-Relationship Diagram) overview available in the [Project Documentation - BaoCaoThucTap.pdf](https://github.com/tandat0303/EnterpriseSystem/blob/main/BaoCaoThucTap.pdf). The file may not be available on Github, so I suggest you dowdload to view it.
## Installation
1. Prerequisites:
- Node.js (v14+)
- MongoDB (local or cloud instance, e.g., MongoDB Atlas)
- Git

2. Clone the repository
```bash
git clone https://github.com/tandat0303/EnterpriseSystem.git
cd EnterpriseSystem
```

3. Install Dependencies:
- For frontend and backend (since Next.js handles both):
```bash
npm install
```

4. Environment Variables:
- Create a .env.local file in the root directory with the following:
```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/enterprise_db

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Next.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Blob Storage Configuration
BLOB_READ_WRITE_TOKEN=
```
5. Run the Application:
- Development mode:
```bash
npm run dev
```

- Production mode:
```bash
npm run build
npm run start
```

The app will be available at http://localhost:3000.
    
## Usage
1. **Login:** Access the login page and use credentials (admin default: email admin@casumina.com, password admin123 – change in production).
2. **Dashboard:** View pending tasks, submitted forms, and quick actions.
3. **Submit a Form:** Navigate to "Forms" > Select template > Fill details > Submit.
4. **Approve Forms:** Approvers see pending forms in their dashboard > Review > Approve/Reject/Comment.
5. **Admin Features:** Manage users, roles, permissions, workflows, and logs via the admin panel.
6. **API Usage:** Interact via REST endpoints (e.g., /api/auth/login, /api/users).


## Testing and Evaluation
- **Testing Objectives:** Ensure functionality, performance, and security.
- **Methods:** Unit tests (Jest), integration tests, manual testing for workflows.
- **Results:** APIs tested with tools like Postman; example: Form API tests passed with 100% coverage for core flows.
## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (git checkout -b feature/YourFeature).
3. Commit changes (git commit -m 'Add YourFeature').
4. Push to the branch (git push origin feature/YourFeature).
5. Open a Pull Request.


## License
This project is licensed under the [MIT License.](https://choosealicense.com/licenses/mit/)


## Contact
Developed by **Truong Tan Dat** during internship at CASUMINA.

Mentor: **Vu Ngoc Khoa** (IT Manager).

Company: CASUMINA - casumina@casumina.com | www.casumina.com

For issues or questions, open an issue on GitHub or contact [dat.truongtan03@gmail.com].

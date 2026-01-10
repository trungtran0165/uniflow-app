# Backend Server - Hệ thống Quản lý Đào tạo (DAHK)

Backend server cho hệ thống quản lý đào tạo đại học, sử dụng **Express.js**, **TypeScript** và **MongoDB**.

## 📋 Tổng quan

Hệ thống phục vụ 3 nhóm người dùng chính:
- **Sinh viên (Student)**: Đăng ký học phần, xem điểm, xem thời khóa biểu
- **Giảng viên (Lecturer)**: Quản lý lớp học, nhập điểm
- **Quản trị viên (Admin)**: Quản lý chương trình đào tạo, lớp học, đợt đăng ký

## 🚀 Cài đặt và Chạy

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

Tạo file `.env` với các biến sau:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Server
PORT=3000
FRONTEND_URL=http://localhost:8080

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### 3. Chạy server

```bash
# Development mode (với hot reload)
npm run dev

# Build project
npm run build

# Production mode
npm start
```

## 📁 Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/              # Cấu hình (database connection)
│   │   └── database.ts
│   ├── models/              # MongoDB Models (Mongoose schemas)
│   │   ├── User.ts          # Tài khoản người dùng
│   │   ├── Student.ts       # Thông tin sinh viên
│   │   ├── Program.ts       # Chương trình đào tạo
│   │   ├── Course.ts        # Học phần
│   │   ├── Class.ts         # Lớp học phần
│   │   ├── Semester.ts      # Học kỳ
│   │   ├── Room.ts          # Phòng học
│   │   ├── Enrollment.ts    # Đăng ký học phần
│   │   ├── Grade.ts         # Điểm số
│   │   ├── GradeConfig.ts   # Cấu hình thành phần điểm
│   │   ├── RegistrationWindow.ts  # Đợt đăng ký học phần
│   │   └── AuditLog.ts      # Nhật ký audit
│   ├── routes/              # API Routes
│   │   ├── auth.ts          # Authentication (login, logout, me)
│   │   ├── users.ts         # Quản lý users
│   │   ├── students.ts      # API cho sinh viên
│   │   ├── curriculum.ts    # Tra cứu chương trình đào tạo
│   │   ├── registration.ts  # Đăng ký học phần
│   │   ├── lecturers.ts     # API cho giảng viên
│   │   └── admin/           # API cho admin
│   │       ├── programs.ts           # Quản lý CTĐT & học phần
│   │       ├── classes.ts            # Quản lý lớp học
│   │       ├── registration-windows.ts # Quản lý đợt đăng ký
│   │       ├── semesters.ts          # Quản lý học kỳ
│   │       └── rooms.ts               # Quản lý phòng học
│   ├── controllers/         # Business logic
│   │   ├── studentController.ts
│   │   ├── curriculumController.ts
│   │   ├── registrationController.ts
│   │   ├── lecturerController.ts
│   │   └── admin/
│   │       ├── programController.ts
│   │       ├── classController.ts
│   │       ├── registrationWindowController.ts
│   │       ├── semesterController.ts
│   │       └── roomController.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── authorize.ts     # RBAC authorization
│   │   └── validate.ts      # Request validation (Zod)
│   ├── utils/               # Utilities
│   │   ├── validation.ts   # Zod schemas
│   │   └── prerequisites.ts # Logic kiểm tra tiên quyết
│   └── server.ts           # Entry point
├── dist/                    # Compiled JavaScript (sau khi build)
├── .env                     # Environment variables
└── package.json
```

## 🗄️ Database Models

### Core Models

- **User**: Tài khoản (email, password, role: admin/student/lecturer)
- **Student**: Thông tin sinh viên (studentId, cohort, major, userId)
- **Program**: Chương trình đào tạo (code, name, cohort, major)
- **Course**: Học phần (code, name, credits, semester, prerequisites)
- **Class**: Lớp học phần (code, courseId, semesterId, lecturerId, schedule, capacity)
- **Semester**: Học kỳ (code, name, type, academicYear, startDate, endDate)
- **Room**: Phòng học (code, name, capacity, type)

### Registration & Grading

- **RegistrationWindow**: Đợt đăng ký (semesterId, startDate, endDate, minCredits, maxCredits, targetCohorts)
- **Enrollment**: Đăng ký học phần (studentId, classId, status: registered/waitlist, isForced)
- **Grade**: Điểm số (enrollmentId, components, finalGrade, letterGrade)
- **GradeConfig**: Cấu hình thành phần điểm (classId, components với weight)

### System

- **AuditLog**: Nhật ký audit (userId, action, resourceType, resourceId, oldValue, newValue)

## 🔐 Authentication & Authorization

### Authentication (JWT)
- **POST** `/api/auth/login` - Đăng nhập
- **POST** `/api/auth/logout` - Đăng xuất
- **GET** `/api/auth/me` - Lấy thông tin user hiện tại

### Authorization (RBAC)
- **Roles**: `admin`, `student`, `lecturer`
- **Middleware**: 
  - `authenticate`: Kiểm tra JWT token
  - `authorize(...roles)`: Kiểm tra role
  - `authorizeSelfOrAdmin`: Cho phép truy cập tài nguyên của chính mình hoặc admin

## 📡 API Endpoints

### Student APIs (`/api/students`)

- **GET** `/:studentId/dashboard` - Dashboard sinh viên
- **GET** `/:studentId/transcript` - Bảng điểm
- **GET** `/:studentId/transcript/summary` - Tóm tắt điểm (GPA)
- **GET** `/:studentId/timetable` - Thời khóa biểu
- **GET** `/:studentId/timetable/:week` - Thời khóa biểu theo tuần
- **GET** `/:studentId/timetable/changes` - Thay đổi lịch học

### Registration APIs (`/api/registration`)

- **GET** `/open-classes` - Danh sách lớp mở đăng ký
- **GET** `/enrollments/:studentId` - Lớp đã đăng ký
- **GET** `/history/:studentId` - Lịch sử đăng ký
- **GET** `/summary/:studentId` - Tóm tắt đăng ký
- **POST** `/enroll` - Đăng ký học phần
- **POST** `/cancel/:enrollmentId` - Hủy đăng ký

### Curriculum APIs (`/api/curriculum`)

- **GET** `/programs` - Danh sách chương trình đào tạo
- **GET** `/programs/:programId` - Chi tiết CTĐT
- **GET** `/programs/:programId/courses` - Danh sách học phần
- **GET** `/programs/:programId/prerequisites` - Điều kiện tiên quyết

### Lecturer APIs (`/api/lecturers`)

- **GET** `/:lecturerId/dashboard` - Dashboard giảng viên
- **GET** `/:lecturerId/classes` - Danh sách lớp dạy
- **GET** `/classes/:classId/students` - Danh sách sinh viên trong lớp
- **GET** `/classes/:classId/grades` - Điểm số lớp
- **GET** `/classes/:classId/grade-template` - Template nhập điểm
- **PUT** `/grades/:gradeId` - Cập nhật điểm
- **POST** `/grades/bulk` - Cập nhật điểm hàng loạt
- **POST** `/classes/:classId/lock` - Khóa sổ điểm
- **POST** `/classes/:classId/unlock` - Mở khóa sổ điểm

### Admin APIs

#### Programs (`/api/admin/programs`)
- **GET** `/` - Danh sách CTĐT
- **POST** `/` - Tạo CTĐT mới
- **GET** `/:programId` - Chi tiết CTĐT
- **PUT** `/:programId` - Cập nhật CTĐT
- **DELETE** `/:programId` - Xóa CTĐT
- **GET** `/:programId/courses` - Danh sách học phần
- **POST** `/:programId/courses` - Tạo học phần mới
- **PUT** `/:programId/courses/:courseId` - Cập nhật học phần
- **DELETE** `/:programId/courses/:courseId` - Xóa học phần
- **PUT** `/:programId/curriculum` - Cập nhật nội dung CTĐT (HTML)

#### Classes (`/api/admin/classes`)
- **GET** `/` - Danh sách lớp học
- **POST** `/` - Tạo lớp mới
- **GET** `/:classId` - Chi tiết lớp
- **PUT** `/:classId` - Cập nhật lớp
- **DELETE** `/:classId` - Xóa lớp
- **GET** `/:classId/students` - Danh sách sinh viên trong lớp

#### Registration Windows (`/api/admin/registration-windows`)
- **GET** `/` - Danh sách đợt đăng ký
- **POST** `/` - Tạo đợt đăng ký mới
- **GET** `/:windowId` - Chi tiết đợt đăng ký
- **PUT** `/:windowId` - Cập nhật đợt đăng ký
- **PATCH** `/:windowId/status` - Thay đổi trạng thái (open/close)
- **DELETE** `/:windowId` - Xóa đợt đăng ký

#### Semesters (`/api/admin/semesters`)
- **GET** `/` - Danh sách học kỳ
- **POST** `/` - Tạo học kỳ mới
- **GET** `/:semesterId` - Chi tiết học kỳ
- **PUT** `/:semesterId` - Cập nhật học kỳ
- **DELETE** `/:semesterId` - Xóa học kỳ

#### Rooms (`/api/admin/rooms`)
- **GET** `/` - Danh sách phòng học
- **POST** `/` - Tạo phòng mới
- **GET** `/:roomId` - Chi tiết phòng
- **PUT** `/:roomId` - Cập nhật phòng
- **DELETE** `/:roomId` - Xóa phòng
- **GET** `/:roomId/schedule` - Lịch sử dụng phòng

## ✨ Tính năng chính

### 1. Đăng ký học phần
- ✅ Kiểm tra đợt đăng ký (thời gian, cohort eligibility)
- ✅ Kiểm tra điều kiện tiên quyết (với cycle detection)
- ✅ Kiểm tra trùng lịch học
- ✅ Kiểm tra giới hạn tín chỉ (min/max)
- ✅ Waitlist tự động khi lớp đầy
- ✅ Auto-promote từ waitlist khi có chỗ trống
- ✅ Race condition protection (MongoDB transactions)
- ✅ Force enrollment (admin có thể bỏ qua rules)

### 2. Quản lý điểm
- ✅ Cấu hình thành phần điểm (weight validation = 100%)
- ✅ Nhập điểm đơn lẻ và hàng loạt
- ✅ Tính điểm tổng kết, GPA (hệ 4 và hệ 10)
- ✅ Khóa/mở khóa sổ điểm
- ✅ Audit log cho mọi thay đổi điểm

### 3. Quản lý lớp học
- ✅ Tạo/sửa/xóa lớp học phần
- ✅ Xếp lịch học (phòng, thời gian)
- ✅ Kiểm tra conflict (phòng và giảng viên)
- ✅ Quản lý sĩ số

### 4. Bảo mật
- ✅ JWT authentication
- ✅ RBAC (Role-Based Access Control)
- ✅ IDOR protection (authorizeSelfOrAdmin)
- ✅ Audit logging cho sensitive actions
- ✅ Input validation (Zod)

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs

## 📝 Lưu ý

### Tạo tài khoản mẫu

Sau khi setup, bạn cần tạo tài khoản thông qua MongoDB hoặc frontend:
- Admin: email `admin@uit.edu.vn`, password `admin123`
- Student: email `student@uit.edu.vn`, password `student123`
- Lecturer: email `lecturer@uit.edu.vn`, password `lecturer123`

⚠️ **Lưu ý bảo mật**: Đổi mật khẩu sau lần đăng nhập đầu tiên!

### Database Indexes

Hệ thống sử dụng các indexes để tối ưu performance:
- Unique indexes cho `studentId`, `code` fields
- Compound indexes cho conflict detection (room + time, lecturer + time)
- Partial indexes cho classes có schedule

### Transactions

Các thao tác quan trọng sử dụng MongoDB transactions để đảm bảo data integrity:
- Enrollment (tránh race condition)
- Cancel enrollment + waitlist promotion

## 🐛 Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra `MONGODB_URI` trong `.env`
- Đảm bảo MongoDB đang chạy
- Kiểm tra network/firewall

### Lỗi 401 Unauthorized
- Kiểm tra JWT token trong request header
- Token có thể đã hết hạn, cần đăng nhập lại

### Lỗi 403 Forbidden
- Kiểm tra role của user
- Kiểm tra `authorizeSelfOrAdmin` middleware

## 📚 Tài liệu tham khảo

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Zod Documentation](https://zod.dev/)

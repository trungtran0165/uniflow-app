# DAHK - Hệ thống Quản lý Đào tạo

Hệ thống quản lý đào tạo đại học toàn diện với giao diện React hiện đại và backend Express.js mạnh mẽ. Dự án hỗ trợ quản lý đăng ký học phần, điểm số, thời khóa biểu và tích hợp với Moodle LMS.

## Contributors

22521533 - Nguyễn Công Nam Triều
22521569 - Trần Quốc Trung

## Tổng quan

DAHK là một hệ thống thông tin sinh viên (SIS) được thiết kế cho các trường đại học, phục vụ 3 nhóm người dùng chính:

- **Sinh viên (Student)**: Đăng ký học phần, xem điểm, quản lý thời khóa biểu
- **Giảng viên (Lecturer)**: Quản lý lớp học, nhập điểm, theo dõi sinh viên
- **Quản trị viên (Admin)**: Quản lý chương trình đào tạo, tạo lớp học, quản lý đợt đăng ký

## Tính năng chính

### Đăng ký học phần thông minh
- ✅ Kiểm tra điều kiện tiên quyết tự động (với phát hiện chu trình)
- ✅ Phát hiện trùng lịch học
- ✅ Kiểm tra giới hạn tín chỉ (min/max)
- ✅ Hệ thống waitlist tự động
- ✅ Tự động promote từ waitlist khi có chỗ trống
- ✅ Bảo vệ race condition với MongoDB transactions
- ✅ Force enrollment cho admin

### Quản lý điểm số
- ✅ Cấu hình linh hoạt thành phần điểm
- ✅ Nhập điểm đơn lẻ và hàng loạt
- ✅ Tính GPA tự động (hệ 4 và hệ 10)
- ✅ Khóa/mở khóa sổ điểm
- ✅ Audit log đầy đủ

### Quản lý lớp học
- ✅ Tạo và xếp lịch lớp học
- ✅ Phát hiện conflict phòng học và giảng viên
- ✅ Quản lý sĩ số tự động
- ✅ Theo dõi thay đổi lịch học

### Tích hợp Moodle (Tùy chọn)
- ✅ Tự động đồng bộ enrollment sang Moodle
- ✅ Tạo user và course tự động
- ✅ Unenroll khi hủy đăng ký

### Bảo mật
- ✅ JWT Authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ IDOR Protection
- ✅ Input Validation với Zod
- ✅ Audit Logging

## Công nghệ sử dụng

### Frontend
- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI Components
- **React Router** - Routing
- **TanStack Query** - Data Fetching & Caching
- **React Hook Form** - Form Management
- **Zod** - Validation

### Backend
- **Node.js** - Runtime
- **Express.js** - Web Framework
- **TypeScript** - Type Safety
- **MongoDB (Mongoose)** - Database
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **Zod** - Validation
- **Axios** - HTTP Client (Moodle Integration)

### Optional
- **Moodle LMS** - Learning Management System (chạy với Docker)

## Cấu trúc dự án

```
uniflow-app/
├── frontend/                 # React Frontend
│   ├── src/
│   │   ├── components/      # UI Components (shadcn/ui)
│   │   ├── pages/           # Page Components
│   │   ├── layouts/         # Layout Components
│   │   ├── hooks/           # Custom React Hooks
│   │   ├── lib/            # Utilities & API Client
│   │   └── data/           # Constants & Mock Data
│   ├── public/             # Static Assets
│   └── package.json
│
├── backend/                 # Express Backend
│   ├── src/
│   │   ├── config/         # Configuration (database)
│   │   ├── models/         # Mongoose Models
│   │   ├── controllers/    # Business Logic
│   │   ├── routes/         # API Routes
│   │   ├── middleware/     # Auth & Validation
│   │   ├── services/       # External Services (Moodle)
│   │   ├── utils/          # Utilities
│   │   └── server.ts       # Entry Point
│   ├── dist/               # Compiled JavaScript
│   └── package.json
│
├── moodle-setup/            # Moodle Docker Setup
│   └── docker-compose.yml
│
└── README.md
```

## Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js >= 18.x
- MongoDB >= 6.x (hoặc MongoDB Atlas)
- npm hoặc yarn
- Docker (nếu muốn chạy Moodle local)

### 1. Clone Repository

```bash
git clone <repository-url>
cd uniflow-app
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục `backend/`:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/dahk
# Hoặc sử dụng MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/dahk

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:8080

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Moodle Integration (Tùy chọn - bỏ trống nếu không dùng)
MOODLE_URL=http://localhost:8081
MOODLE_TOKEN=your-moodle-webservice-token
MOODLE_CATEGORY_ID=1
```

** LƯU Ý BẢO MẬT:**
- KHÔNG commit file `.env` lên Git
- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên mạnh
- Sử dụng mật khẩu phức tạp cho MongoDB

Chạy backend:

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Backend sẽ chạy tại: `http://localhost:3000`

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:8080`

### 4. Cài đặt Moodle (Tùy chọn)

Nếu muốn sử dụng tích hợp Moodle:

```bash
cd moodle-setup

# Tạo volumes trước
docker volume create moodle-setup_moodle-data
docker volume create moodle-setup_moodledata
docker volume create moodle-setup_moodle-db-data

# Chạy Moodle
docker-compose up -d
```

Moodle sẽ chạy tại: `http://localhost:8081`

**Cấu hình Moodle:**
1. Truy cập `http://localhost:8081` và hoàn tất setup wizard
2. Đăng nhập với tài khoản admin
3. Vào **Site administration** → **Plugins** → **Web services** → **Manage tokens**
4. Tạo token mới cho user admin
5. Copy token và paste vào `MOODLE_TOKEN` trong file `.env` của backend

## 📚 Database Models

### Core Models
- **User**: Tài khoản người dùng (email, password, role)
- **Student**: Thông tin sinh viên (studentId, cohort, major)
- **Program**: Chương trình đào tạo (code, name, cohort, major)
- **Course**: Học phần (code, name, credits, prerequisites)
- **Class**: Lớp học phần (code, courseId, semesterId, schedule, capacity)
- **Semester**: Học kỳ (code, name, type, academicYear, startDate, endDate)
- **Room**: Phòng học (code, name, capacity, type)

### Registration & Grading
- **RegistrationWindow**: Đợt đăng ký (semesterId, startDate, endDate, minCredits, maxCredits)
- **Enrollment**: Đăng ký học phần (studentId, classId, status, isForced)
- **Grade**: Điểm số (enrollmentId, components, finalGrade, letterGrade)
- **GradeConfig**: Cấu hình thành phần điểm (classId, components)

### System
- **AuditLog**: Nhật ký audit (userId, action, resourceType, resourceId)

## Authentication & Authorization

### Roles
- `admin` - Quản trị viên: Full access
- `lecturer` - Giảng viên: Quản lý lớp và điểm
- `student` - Sinh viên: Đăng ký và xem thông tin cá nhân

### Protected Routes
Tất cả API endpoints (trừ `/api/auth/login`) đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your-jwt-token>
```

### Default Accounts

Sau khi setup, bạn cần tạo tài khoản admin đầu tiên thông qua MongoDB hoặc registration endpoint. Ví dụ tài khoản mẫu:

- **Admin**: `admin@uit.edu.vn` / `admin123`
- **Giảng viên**: `lecturer@uit.edu.vn` / `lecturer123`
- **Sinh viên**: `student@uit.edu.vn` / `student123`

** QUAN TRỌNG**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên!

## 📡 API Endpoints Chính

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user

### Student
- `GET /api/students/:studentId/dashboard` - Dashboard
- `GET /api/students/:studentId/transcript` - Bảng điểm
- `GET /api/students/:studentId/timetable` - Thời khóa biểu

### Registration
- `GET /api/registration/open-classes` - Danh sách lớp mở
- `POST /api/registration/enroll` - Đăng ký học phần
- `POST /api/registration/cancel/:enrollmentId` - Hủy đăng ký
- `GET /api/registration/enrollments/:studentId` - Lớp đã đăng ký

### Lecturer
- `GET /api/lecturers/:lecturerId/dashboard` - Dashboard giảng viên
- `GET /api/lecturers/:lecturerId/classes` - Danh sách lớp dạy
- `GET /api/lecturers/classes/:classId/students` - Sinh viên trong lớp
- `PUT /api/lecturers/grades/:gradeId` - Cập nhật điểm
- `POST /api/lecturers/classes/:classId/lock` - Khóa sổ điểm

### Admin
- `GET /api/admin/programs` - Quản lý chương trình đào tạo
- `GET /api/admin/classes` - Quản lý lớp học
- `GET /api/admin/registration-windows` - Quản lý đợt đăng ký
- `GET /api/admin/semesters` - Quản lý học kỳ
- `GET /api/admin/rooms` - Quản lý phòng học

Xem file `backend/README.md` (trước khi xóa) để biết chi tiết đầy đủ về tất cả endpoints.

## Scripts

### Frontend
```bash
npm run dev      # Chạy development server (port 8080)
npm run build    # Build production
npm run preview  # Preview production build
npm run lint     # Lint code
```

### Backend
```bash
npm run dev      # Chạy development server với hot reload
npm run build    # Compile TypeScript
npm start        # Chạy production server
npm run lint     # Lint code
```

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint configured
- Prettier for formatting

### Database Transactions
Các thao tác quan trọng sử dụng MongoDB transactions:
- Enrollment (tránh race condition)
- Cancel enrollment + waitlist promotion

### Performance
- Indexes được tạo tự động cho các trường quan trọng
- Compound indexes cho conflict detection
- TanStack Query caching ở frontend

## Troubleshooting

### Backend không kết nối được MongoDB
- Kiểm tra `MONGODB_URI` trong `.env`
- Đảm bảo MongoDB đang chạy
- Kiểm tra network/firewall

### Frontend không gọi được API
- Kiểm tra `FRONTEND_URL` trong backend `.env`
- Kiểm tra CORS configuration
- Xem Console logs trong browser

### Lỗi 401 Unauthorized
- JWT token có thể đã hết hạn → Đăng nhập lại
- Kiểm tra header `Authorization: Bearer <token>`

### Lỗi 403 Forbidden
- User không có quyền truy cập resource
- Kiểm tra role của user

### Moodle integration không hoạt động
- Kiểm tra `MOODLE_URL` và `MOODLE_TOKEN` trong `.env`
- Đảm bảo Moodle Web Services được enable
- Kiểm tra Moodle logs

## Deployment

### Production Checklist
- [ ] Đổi `JWT_SECRET` thành chuỗi mạnh
- [ ] Sử dụng MongoDB Atlas hoặc MongoDB production server
- [ ] Set `NODE_ENV=production`
- [ ] Build frontend: `npm run build`
- [ ] Sử dụng process manager như PM2 cho backend
- [ ] Setup SSL/TLS certificates
- [ ] Configure reverse proxy (nginx)
- [ ] Setup monitoring và logging
- [ ] Regular database backups
- [ ] KHÔNG commit file `.env`

### Environment Variables cần thiết
```env
# Backend
MONGODB_URI=<production-mongodb-uri>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
FRONTEND_URL=<production-frontend-url>
PORT=3000

# Optional: Moodle
MOODLE_URL=<production-moodle-url>
MOODLE_TOKEN=<production-moodle-token>
MOODLE_CATEGORY_ID=1
```

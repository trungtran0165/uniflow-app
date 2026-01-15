# Thông tin Login Moodle cho Student

## 🔑 Thông tin đăng nhập

Sau khi admin tạo student trong SIS, hệ thống **tự động tạo tài khoản Moodle** với thông tin:

### Student Login Credentials

- **URL Moodle**: `http://localhost:8081`
- **Username**: `{MSSV}` (Student ID - ví dụ: `22521497`)
- **Password mặc định**: `TempPassword123!`

### Lần đăng nhập đầu tiên

1. Truy cập `http://localhost:8081`
2. Click **Log in**
3. Nhập:
   - **Username**: MSSV (ví dụ: `22521497`)
   - **Password**: `TempPassword123!`
4. Moodle sẽ yêu cầu **đổi password** ngay lần đầu login
5. Tạo password mới và xác nhận

---

## 🔄 Khi nào tài khoản Moodle được tạo?

Có 2 trường hợp:

### 1. Khi Admin tạo Student trong SIS (✅ Khuyến nghị)

```
Admin → Create Student → Tự động tạo Moodle user
```

**Ưu điểm**: Student có thể login ngay vào Moodle, không cần đợi đăng ký học phần

### 2. Khi Student đăng ký học phần lần đầu

```
Student → Register Class → Tự động tạo Moodle user (nếu chưa có)
```

**Lưu ý**: Nếu student chưa được tạo bởi admin, sẽ tự động tạo khi đăng ký môn đầu tiên

---

## 📋 Kiểm tra tài khoản Moodle

### Cách 1: Login thử trên Moodle

Student tự login vào `http://localhost:8081` với username/password như trên

### Cách 2: Admin kiểm tra trong Moodle

1. Login Moodle với admin account
2. Vào **Site administration** → **Users** → **Browse list of users**
3. Search theo email hoặc username (MSSV)

---

## ⚙️ Cấu hình

### Backend đã được setup với:

```env
MOODLE_URL=http://localhost:8081
MOODLE_TOKEN=964196bb33182737a31f06bd5a71554b
MOODLE_CATEGORY_ID=1
```

### Tính năng tự động:

✅ **Auto-create Moodle user** khi admin tạo student  
✅ **Auto-create Moodle course** khi student đăng ký học phần  
✅ **Auto-enroll student** vào course trên Moodle

---

## 🛠️ Troubleshooting

### Student không login được Moodle?

**Lỗi**: "Invalid login"

**Nguyên nhân**:
1. Username sai (phải dùng MSSV, không phải email)
2. Password chưa đổi từ mặc định
3. Tài khoản chưa được tạo

**Giải pháp**:
1. Kiểm tra username = MSSV (ví dụ: `22521497`)
2. Dùng password mặc định: `TempPassword123!`
3. Nếu vẫn lỗi → kiểm tra backend log xem có tạo user thành công không

### Backend log: "⚠️ Moodle not configured"

**Nguyên nhân**: Token hoặc URL chưa được setup đúng

**Giải pháp**: Kiểm tra `.env` file

### Backend log: "❌ Failed to create Moodle user"

**Nguyên nhân**: Moodle Web Services chưa được setup đúng

**Giải pháp**: Xem lại `MOODLE_SETUP.md` để enable Web Services

---

## 📝 Lưu ý quan trọng

1. **Password mặc định** (`TempPassword123!`) chỉ dùng cho lần login đầu
2. Student **phải đổi password** sau lần login đầu tiên
3. Password mới student tự quản lý, admin không biết
4. Nếu quên password → admin có thể reset trong Moodle admin panel

---

## 🔐 Bảo mật

- Password mặc định chỉ nên dùng trong môi trường development
- Trong production, nên:
  - Tạo password ngẫu nhiên cho mỗi student
  - Gửi password qua email
  - Hoặc yêu cầu student tự reset password lần đầu

---

## 📞 Hỗ trợ

Nếu có vấn đề với Moodle login:
1. Kiểm tra backend log (terminal chạy `npm run dev`)
2. Kiểm tra Moodle admin panel
3. Xem file `MOODLE_SETUP.md` để verify cấu hình Web Services

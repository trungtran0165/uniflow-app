# DAHK Project

Dự án quản lý đăng ký học phần với frontend React và backend Express.

## Cấu trúc dự án

```
.
├── frontend/          # React + Vite frontend
├── backend/           # Express + TypeScript backend
└── README.md
```

## Cài đặt và chạy

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: http://localhost:8080

### Backend

```bash
cd backend
npm install

# Tạo file .env (nếu chưa có)
# File .env đã được tạo với MongoDB connection string

npm run dev
```

Backend sẽ chạy tại: http://localhost:3000

## MongoDB

MongoDB connection string đã được cấu hình trong `backend/.env`:
- Database: DAHK
- Connection: mongodb+srv://namtrieu007:KTGaming@cluster0.i2usc.mongodb.net/DAHK

## Công nghệ sử dụng

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query

### Backend
- Node.js
- Express
- TypeScript
- MongoDB (Mongoose)
- CORS

## Scripts

### Frontend
- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build

### Backend
- `npm run dev` - Chạy development server với hot reload
- `npm run build` - Build TypeScript
- `npm start` - Chạy production server

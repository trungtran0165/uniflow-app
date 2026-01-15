import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ClassStudentRow = {
  enrollmentId?: string;
  student?: {
    studentId?: string;
    userId?: {
      name?: string;
      email?: string;
    };
  };
  enrolledAt?: string;
  status?: string;
  waitlistPosition?: number;
};

function formatStatus(status?: string, waitlistPosition?: number) {
  if (status === "registered") return "Đã đăng ký";
  if (status === "waitlist") return `Waitlist #${waitlistPosition ?? "?"}`;
  return status || "";
}

function safeFilePart(value?: string) {
  return (value || "N_A").trim().replace(/[\\/:*?"<>|]+/g, "_");
}

export function exportClassStudentsToExcel(params: {
  classCode: string;
  courseName?: string;
  semesterName?: string;
  students: ClassStudentRow[];
}) {
  const { classCode, courseName, semesterName, students } = params;

  const rows = students.map((row, idx) => ({
    STT: idx + 1,
    MSSV: row.student?.studentId || "",
    "Họ tên": row.student?.userId?.name || "",
    Email: row.student?.userId?.email || "",
    "Trạng thái": formatStatus(row.status, row.waitlistPosition),
    "Thời gian đăng ký": row.enrolledAt ? new Date(row.enrolledAt).toLocaleString() : "",
    "Enrollment ID": row.enrollmentId || "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["STT", "MSSV", "Họ tên", "Email", "Trạng thái", "Thời gian đăng ký", "Enrollment ID"],
  });
  sheet["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 26 }];

  const workbook = XLSX.utils.book_new();
  const sheetName = safeFilePart(classCode).slice(0, 31); // Excel limit
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName || "Students");

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Lớp", classCode],
    ["Học phần", courseName || ""],
    ["Học kỳ", semesterName || ""],
    ["Xuất lúc", new Date().toLocaleString()],
    ["Tổng", students.length],
  ]);
  metaSheet["!cols"] = [{ wch: 14 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Thông tin");

  const fileName = [
    "students",
    safeFilePart(classCode),
    safeFilePart(semesterName),
    safeFilePart(courseName),
    new Date().toISOString().slice(0, 10),
  ]
    .filter(Boolean)
    .join("_")
    .replace(/_+/g, "_")
    .concat(".xlsx");

  const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(blob, fileName);
}

type StudentRow = {
  studentId?: string;
  cohort?: string;
  major?: string;
  status?: string;
  userId?: { name?: string; email?: string };
  programId?: { code?: string; majorLabel?: string; cohort?: string };
};

export function exportStudentsToExcel(students: StudentRow[]) {
  const rows = students.map((s, idx) => ({
    STT: idx + 1,
    MSSV: s.studentId || "",
    "Họ tên": s.userId?.name || "",
    Email: s.userId?.email || "",
    "CTĐT": s.programId ? `${s.programId.code || ""} • ${s.programId.majorLabel || ""}` : "Chưa gán",
    "Khóa": s.cohort || s.programId?.cohort || "",
    "Trạng thái": s.status || "",
  }));

  const sheet = XLSX.utils.json_to_sheet(rows, {
    header: ["STT", "MSSV", "Họ tên", "Email", "CTĐT", "Khóa", "Trạng thái"],
  });
  sheet["!cols"] = [{ wch: 6 }, { wch: 12 }, { wch: 26 }, { wch: 28 }, { wch: 28 }, { wch: 10 }, { wch: 14 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Students");

  const fileName = `students_${new Date().toISOString().slice(0, 10)}.xlsx`;
  const out = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  saveAs(blob, fileName);
}




import { useMemo } from "react";

export type AnnouncementCategory = "registration" | "schedule" | "academic";

export interface StudentAnnouncement {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: AnnouncementCategory;
}

export type ScheduleStatus = "ongoing" | "upcoming" | "changed";

export interface TodayScheduleSlot {
  id: string;
  time: string;
  course: string;
  code: string;
  room: string;
  status: ScheduleStatus;
}

export type CurriculumCourseStatus = "completed" | "in-progress" | "pending";

export interface CurriculumCourse {
  code: string;
  name: string;
  credits: number;
  type: "Bắt buộc" | "Tự chọn";
  status: CurriculumCourseStatus;
  prerequisites?: string[];
  description?: string;
}

export interface CurriculumSemester {
  id: string;
  label: string;
  note?: string;
  courses: CurriculumCourse[];
}

export type OpenClassStatus = "available" | "full" | "conflict" | "prerequisite" | "credit-limit";

export interface OpenClassRow {
  id: string;
  code: string;
  name: string;
  faculty: string;
  credits: number;
  capacity: number;
  enrolled: number;
  status: OpenClassStatus;
  time: string;
  instructor: string;
  note?: string;
}

export interface EnrollmentRow {
  id: string;
  code: string;
  name: string;
  credits: number;
  section: string;
  schedule: string;
  instructor: string;
  status: "registered" | "waitlisted";
}

export interface RegistrationHistoryItem {
  id: string;
  timestamp: string;
  action: "register" | "cancel";
  classCode: string;
  className: string;
  result: "success" | "failed";
  reason?: string;
}

export interface TimetableDaySlot {
  id: string;
  day: string;
  period: string;
  course: string;
  room: string;
  status?: "normal" | "changed" | "cancelled";
  changeNote?: string;
}

export interface TimetableWeek {
  id: string;
  label: string;
  days: {
    day: string;
    slots: TimetableDaySlot[];
  }[];
  alerts: {
    id: string;
    message: string;
    severity: "info" | "warning" | "danger";
  }[];
}

export interface TranscriptCourse {
  code: string;
  name: string;
  credits: number;
  processScore: number;
  finalScore: number;
  letter: string;
}

export interface TranscriptTerm {
  id: string;
  label: string;
  gpa10: number;
  gpa4: number;
  credits: number;
  courses: TranscriptCourse[];
}

const announcements: StudentAnnouncement[] = [
  {
    id: "ann-1",
    title: "Đổi phòng học CTDL & GT",
    description: "Tiết 1-3 ngày 12/12 chuyển sang phòng B1-205 do bảo trì hệ thống điện.",
    timestamp: "12/12 · 07:00",
    category: "schedule",
  },
  {
    id: "ann-2",
    title: "Đợt ĐKHP đợt 1 mở đến 23:59 · 20/12",
    description: "Hoàn tất đăng ký để giữ chỗ trước khi chuyển sang đợt bổ sung.",
    timestamp: "10/12 · 09:15",
    category: "registration",
  },
  {
    id: "ann-3",
    title: "Cập nhật điểm giữa kỳ CSDL",
    description: "Điểm quá trình đã được giảng viên nhập, vui lòng kiểm tra lại.",
    timestamp: "09/12 · 21:30",
    category: "academic",
  },
];

const todaySchedule: TodayScheduleSlot[] = [
  {
    id: "slot-1",
    time: "07:30 – 09:15",
    course: "Cấu trúc dữ liệu & Giải thuật",
    code: "CTDLGT202",
    room: "B1-205",
    status: "ongoing",
  },
  {
    id: "slot-2",
    time: "09:30 – 11:15",
    course: "Cơ sở dữ liệu",
    code: "CSDL204",
    room: "B1-203",
    status: "upcoming",
  },
  {
    id: "slot-3",
    time: "13:00 – 15:30",
    course: "Hệ điều hành",
    code: "HDH205",
    room: "A2-401",
    status: "upcoming",
  },
];

const taskList = [
  {
    id: "task-1",
    title: "Hoàn tất ĐKHP đợt 1",
    context: "HK2 2025–2026",
    due: "23:59 hôm nay",
    type: "registration",
  },
  {
    id: "task-2",
    title: "Nộp bài tập lớn CTDL",
    context: "Nhóm 3",
    due: "Thứ 5, 21/12",
    type: "assignment",
  },
  {
    id: "task-3",
    title: "Ôn thi giữa kỳ CSDL",
    context: "Phòng tự học B1",
    due: "Thứ 7, 23/12",
    type: "exam",
  },
];

export const curriculumSemesters: CurriculumSemester[] = [
  {
    id: "sem-1",
    label: "Học kỳ 1",
    note: "Các học phần nền tảng bắt buộc.",
    courses: [
      {
        code: "MATH101",
        name: "Toán cao cấp 1",
        credits: 3,
        type: "Bắt buộc",
        status: "completed",
      },
      {
        code: "PHYS101",
        name: "Vật lý đại cương",
        credits: 3,
        type: "Bắt buộc",
        status: "completed",
      },
      {
        code: "ENG101",
        name: "Tiếng Anh học thuật 1",
        credits: 2,
        type: "Bắt buộc",
        status: "completed",
      },
    ],
  },
  {
    id: "sem-2",
    label: "Học kỳ 2",
    courses: [
      {
        code: "CTDLGT202",
        name: "Cấu trúc dữ liệu & Giải thuật",
        credits: 3,
        type: "Bắt buộc",
        status: "in-progress",
        prerequisites: ["LAPTRINH1"],
      },
      {
        code: "CSDL204",
        name: "Cơ sở dữ liệu",
        credits: 3,
        type: "Bắt buộc",
        status: "in-progress",
        prerequisites: ["CTDLGT202"],
      },
      {
        code: "MACRO201",
        name: "Kinh tế vĩ mô",
        credits: 2,
        type: "Tự chọn",
        status: "pending",
      },
    ],
  },
  {
    id: "sem-3",
    label: "Học kỳ 3",
    note: "Ưu tiên học phần chuyên ngành.",
    courses: [
      {
        code: "HDH205",
        name: "Hệ điều hành",
        credits: 3,
        type: "Bắt buộc",
        status: "pending",
        prerequisites: ["CTDLGT202"],
      },
      {
        code: "MOBILE301",
        name: "Lập trình di động",
        credits: 3,
        type: "Tự chọn",
        status: "pending",
      },
      {
        code: "SEMINAR101",
        name: "Seminar nghề nghiệp",
        credits: 1,
        type: "Tự chọn",
        status: "pending",
      },
    ],
  },
];

export const openClasses: OpenClassRow[] = [
  {
    id: "cls-1",
    code: "CTDLGT202-01",
    name: "Cấu trúc dữ liệu & Giải thuật",
    faculty: "CNTT",
    credits: 3,
    capacity: 80,
    enrolled: 72,
    status: "available",
    time: "Thứ 2 (Tiết 1-3) • B1-205",
    instructor: "TS. Nguyễn Văn Long",
  },
  {
    id: "cls-2",
    code: "CSDL204-02",
    name: "Cơ sở dữ liệu",
    faculty: "CNTT",
    credits: 3,
    capacity: 80,
    enrolled: 80,
    status: "full",
    time: "Thứ 3 (Tiết 4-6) • B1-203",
    instructor: "ThS. Trần Thị Minh",
    note: "Sĩ số đã đạt tối đa",
  },
  {
    id: "cls-3",
    code: "HDH205-01",
    name: "Hệ điều hành",
    faculty: "CNTT",
    credits: 3,
    capacity: 60,
    enrolled: 40,
    status: "conflict",
    time: "Thứ 2 (Tiết 1-3) • A2-401",
    instructor: "ThS. Lê Hoàng",
    note: "Trùng lịch với CTDLGT202-01",
  },
  {
    id: "cls-4",
    code: "MACRO201-01",
    name: "Kinh tế vĩ mô",
    faculty: "Kinh tế",
    credits: 2,
    capacity: 70,
    enrolled: 55,
    status: "prerequisite",
    time: "Thứ 4 (Tiết 7-9) • C1-201",
    instructor: "PGS. TS. Lưu Bình",
    note: "Chưa đạt môn Kinh tế vi mô",
  },
];

export const enrollmentRows: EnrollmentRow[] = [
  {
    id: "enr-1",
    code: "CTDLGT202-01",
    name: "Cấu trúc dữ liệu & Giải thuật",
    credits: 3,
    section: "Nhóm 1",
    schedule: "Thứ 2 (1-3) • B1-205",
    instructor: "TS. Nguyễn Văn Long",
    status: "registered",
  },
  {
    id: "enr-2",
    code: "CSDL204-01",
    name: "Cơ sở dữ liệu",
    credits: 3,
    section: "Nhóm 2",
    schedule: "Thứ 3 (4-6) • B1-203",
    instructor: "ThS. Trần Thị Minh",
    status: "registered",
  },
  {
    id: "enr-3",
    code: "TA300-02",
    name: "Tiếng Anh học thuật 3",
    credits: 2,
    section: "Nhóm 4",
    schedule: "Thứ 5 (1-3) • A1-302",
    instructor: "Ms. Julia",
    status: "waitlisted",
  },
];

export const registrationHistory: RegistrationHistoryItem[] = [
  {
    id: "log-1",
    timestamp: "12/12 · 10:12",
    action: "register",
    classCode: "CTDLGT202-01",
    className: "Cấu trúc dữ liệu & Giải thuật",
    result: "success",
  },
  {
    id: "log-2",
    timestamp: "12/12 · 10:05",
    action: "cancel",
    classCode: "TA200-01",
    className: "Tiếng Anh học thuật 2",
    result: "success",
  },
  {
    id: "log-3",
    timestamp: "12/12 · 09:58",
    action: "register",
    classCode: "CSDL204-02",
    className: "Cơ sở dữ liệu",
    result: "failed",
    reason: "Lớp đã đủ sĩ số",
  },
  {
    id: "log-4",
    timestamp: "11/12 · 21:00",
    action: "register",
    classCode: "HDH205-01",
    className: "Hệ điều hành",
    result: "failed",
    reason: "Trùng lịch với CTDLGT202-01",
  },
  {
    id: "log-5",
    timestamp: "11/12 · 14:20",
    action: "register",
    classCode: "MOBILE301-02",
    className: "Lập trình di động",
    result: "success",
  },
];

export const timetableWeeks: TimetableWeek[] = [
  {
    id: "week-12",
    label: "Tuần 12 (09 – 15/12)",
    days: [
      {
        day: "Thứ 2",
        slots: [
          {
            id: "tt-1",
            day: "Thứ 2",
            period: "Tiết 1-3",
            course: "CTDL & GT",
            room: "B1-205",
            status: "changed",
            changeNote: "Chuyển phòng B1-205 (cũ B1-103)",
          },
          {
            id: "tt-2",
            day: "Thứ 2",
            period: "Tiết 4-6",
            course: "Triết học Mác – Lênin",
            room: "C2-201",
          },
        ],
      },
      {
        day: "Thứ 3",
        slots: [
          {
            id: "tt-3",
            day: "Thứ 3",
            period: "Tiết 4-6",
            course: "Cơ sở dữ liệu",
            room: "B1-203",
          },
        ],
      },
      {
        day: "Thứ 4",
        slots: [
          {
            id: "tt-4",
            day: "Thứ 4",
            period: "Tiết 7-9",
            course: "Kinh tế vĩ mô",
            room: "C1-201",
            status: "cancelled",
            changeNote: "Giảng viên bận, học bù tuần sau",
          },
        ],
      },
      {
        day: "Thứ 5",
        slots: [
          {
            id: "tt-5",
            day: "Thứ 5",
            period: "Tiết 1-3",
            course: "Hệ điều hành",
            room: "A2-401",
          },
        ],
      },
    ],
    alerts: [
      {
        id: "alert-1",
        message: "CTDL & GT chuyển phòng B1-205 trong tuần 12.",
        severity: "info",
      },
      {
        id: "alert-2",
        message: "Kinh tế vĩ mô nghỉ 1 buổi, học bù tuần 13.",
        severity: "warning",
      },
    ],
  },
  {
    id: "week-13",
    label: "Tuần 13 (16 – 22/12)",
    days: [
      {
        day: "Thứ 2",
        slots: [
          {
            id: "tt-6",
            day: "Thứ 2",
            period: "Tiết 1-3",
            course: "CTDL & GT",
            room: "B1-103",
          },
        ],
      },
      {
        day: "Thứ 3",
        slots: [
          {
            id: "tt-7",
            day: "Thứ 3",
            period: "Tiết 4-6",
            course: "Cơ sở dữ liệu",
            room: "B1-203",
          },
        ],
      },
      {
        day: "Thứ 4",
        slots: [
          {
            id: "tt-8",
            day: "Thứ 4",
            period: "Tiết 7-9",
            course: "Kinh tế vĩ mô (bù)",
            room: "C1-201",
          },
        ],
      },
      {
        day: "Thứ 5",
        slots: [
          {
            id: "tt-9",
            day: "Thứ 5",
            period: "Tiết 1-3",
            course: "Hệ điều hành",
            room: "A2-401",
          },
        ],
      },
    ],
    alerts: [
      {
        id: "alert-3",
        message: "Có buổi học bù Kinh tế vĩ mô vào Thứ 4 (Tiết 7-9).",
        severity: "info",
      },
    ],
  },
];

export const transcriptTerms: TranscriptTerm[] = [
  {
    id: "term-hk1-2526",
    label: "HK1 2025–2026",
    gpa10: 8.1,
    gpa4: 3.42,
    credits: 18,
    courses: [
      { code: "CTDLGT202", name: "Cấu trúc dữ liệu & Giải thuật", credits: 3, processScore: 8.5, finalScore: 8.0, letter: "A" },
      { code: "CSDL204", name: "Cơ sở dữ liệu", credits: 3, processScore: 7.8, finalScore: 8.0, letter: "B+" },
      { code: "KTTC101", name: "Kinh tế chính trị", credits: 2, processScore: 8.2, finalScore: 8.5, letter: "A-" },
    ],
  },
  {
    id: "term-hk2-2425",
    label: "HK2 2024–2025",
    gpa10: 7.8,
    gpa4: 3.25,
    credits: 20,
    courses: [
      { code: "LAPTRINH1", name: "Lập trình cơ bản", credits: 3, processScore: 8.0, finalScore: 8.2, letter: "A" },
      { code: "TOANC1", name: "Toán cao cấp 1", credits: 3, processScore: 7.0, finalScore: 7.2, letter: "B" },
      { code: "TA200", name: "Tiếng Anh học thuật 2", credits: 2, processScore: 7.5, finalScore: 7.8, letter: "B+" },
    ],
  },
];

export const transcriptSummary = {
  cumulativeGpa4: 3.36,
  cumulativeCredits: 96,
  ranking: "Khá",
  blocked: false,
};

const quickLinks = [
  { label: "Đăng ký học phần", to: "/student/registration" },
  { label: "Quản lý đăng ký", to: "/student/registration/manage" },
  { label: "Xem thời khóa biểu", to: "/student/timetable" },
  { label: "Tra cứu bảng điểm", to: "/student/transcript" },
];

export const useMockStudentSummary = () => {
  return useMemo(
    () => ({
      profile: {
        name: "Nguyễn Văn A",
        code: "20520001",
        cohort: "K2022",
        major: "Khoa học máy tính",
      },
      stats: {
        currentTerm: "HK2 2025–2026",
        currentCredits: 18,
        creditsAccumulated: 96,
        creditsTarget: 130,
        gpa: 3.42,
        gpaDelta: 0.12,
        tasks: taskList.length,
      },
      announcements,
      scheduleToday: todaySchedule,
      tasks: taskList,
      quickLinks,
    }),
    [],
  );
};

export const mockRegistrationSummary = {
  minCredits: 14,
  maxCredits: 24,
  deadline: "23:59 · 20/12/2025",
};


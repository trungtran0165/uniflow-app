import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  School,
  FileText,
  Users,
  BookOpen,
  ListChecks,
  History,
} from "lucide-react";

export type Role = "student" | "lecturer" | "admin";

interface AppLayoutProps {
  role: Role;
  children: ReactNode;
}

const roleMeta: Record<Role, { label: string; badgeClass: string }> = {
  student: { label: "Sinh viên", badgeClass: "bg-primary/10 text-primary" },
  lecturer: { label: "Giảng viên", badgeClass: "bg-emerald-500/10 text-emerald-500" },
  admin: { label: "PĐT / Admin", badgeClass: "bg-accent/10 text-accent-foreground" },
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const navByRole: Record<Role, NavItem[]> = {
  student: [
    { label: "Dashboard", to: "/student/dashboard", icon: LayoutDashboard },
    { label: "Tra cứu CTĐT", to: "/student/curriculum", icon: BookOpen },
    { label: "Đăng ký học phần", to: "/registration", icon: ClipboardList },
    { label: "Quản lý ĐK cá nhân", to: "/student/registration/manage", icon: ListChecks },
    { label: "Lịch sử ĐKHP", to: "/student/registration/history", icon: History },
    { label: "Thời khóa biểu", to: "/student/timetable", icon: CalendarDays },
    { label: "Kết quả học tập", to: "/student/transcript", icon: FileText },
  ],
  lecturer: [
    { label: "Dashboard", to: "/lecturer", icon: LayoutDashboard },
    { label: "Lớp phụ trách", to: "/lecturer/classes", icon: Users },
    { label: "Nhập điểm", to: "/lecturer/grading", icon: ClipboardList },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "CTĐT & Học phần", to: "/admin/programs", icon: School },
    { label: "Kỳ học & Lớp học phần", to: "/admin/classes", icon: Users },
    { label: "Đợt ĐKHP", to: "/admin/registration-windows", icon: CalendarDays },
  ],
};

export const AppLayout = ({ role, children }: AppLayoutProps) => {
  const location = useLocation();
  const navItems = navByRole[role];
  const meta = roleMeta[role];
  const homeByRole: Record<Role, string> = {
    student: "/student/dashboard",
    lecturer: "/lecturer",
    admin: "/admin",
  };
  const home = homeByRole[role];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="sidebar">
        <SidebarHeader className="border-b border-sidebar-border pb-3">
          <Link to={home} className="flex items-center gap-2 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">UniReg</span>
              <span className="text-[11px] text-sidebar-foreground/70">Student IS</span>
            </div>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <span className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/70">
                Không gian làm việc
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== "/" && location.pathname.startsWith(item.to));
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <NavLink to={item.to} end className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span className="truncate text-sm">{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <div className="mt-auto px-4 pb-6 text-center">
            <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/10 px-3 py-4">
              <img
                src="/uit_logo.png"
                alt="University of Information Technology"
                className="mx-auto mb-2 h-20 w-auto object-contain"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-foreground/80">UIT Partner</p>
              <p className="text-[10px] text-sidebar-foreground/60">ĐH CNTT – ĐHQG TP.HCM</p>
            </div>
          </div>
        </SidebarContent>
      </Sidebar>

      <SidebarInset className="app-shell">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden flex-col sm:flex">
              <span className="text-xs text-muted-foreground">Hệ thống quản lý sinh viên &amp; ĐKHP</span>
              <span className="text-sm font-semibold">UniReg Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden rounded-full px-3 py-1 text-xs font-medium sm:flex ${meta.badgeClass}`}>
              {meta.label}
            </div>
            <RoleSwitcher currentRole={role} />
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="text-[11px] font-semibold">
                {role === "student" && "SV"}
                {role === "lecturer" && "GV"}
                {role === "admin" && "AD"}
              </AvatarFallback>
            </Avatar>
          </div>
        </header>

        <div className="px-4 pb-6 pt-4">
          <div className="mx-auto max-w-6xl space-y-4">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

type RoleSwitcherProps = {
  currentRole: Role;
};

const RoleSwitcher = ({ currentRole }: RoleSwitcherProps) => {
  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary px-1 py-1 text-xs">
      <RoleChip to="/student" active={currentRole === "student"}>
        SV
      </RoleChip>
      <RoleChip to="/lecturer" active={currentRole === "lecturer"}>
        GV
      </RoleChip>
      <RoleChip to="/admin" active={currentRole === "admin"}>
        PĐT
      </RoleChip>
    </div>
  );
};

interface RoleChipProps {
  to: string;
  active?: boolean;
  children: ReactNode;
}

const RoleChip = ({ to, active, children }: RoleChipProps) => (
  <Button
    asChild
    size="sm"
    variant={active ? "default" : "ghost"}
    className={`h-7 rounded-full px-3 text-[11px] ${active ? "shadow-sm" : ""}`}
  >
    <NavLink to={to}>{children}</NavLink>
  </Button>
);

export default AppLayout;

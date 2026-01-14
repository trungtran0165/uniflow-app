import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@/layouts/AppLayout";

type Props = {
  role: Role;
  children: ReactNode;
};

const homeByRole: Record<Role, string> = {
  student: "/student",
  lecturer: "/lecturer",
  admin: "/admin",
};

function getRoleFromToken(token: string): Role | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payloadBase64Url = parts[1];
    const payloadBase64 = payloadBase64Url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = payloadBase64.length % 4;
    const padded = payloadBase64 + (pad ? "=".repeat(4 - pad) : "");

    const json = decodeURIComponent(
      Array.from(atob(padded))
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    const payload = JSON.parse(json) as { role?: string; exp?: number };

    if (payload?.exp && Date.now() / 1000 > payload.exp) return null;

    const r = payload?.role;
    if (r === "student" || r === "lecturer" || r === "admin") return r;
    return null;
  } catch {
    return null;
  }
}

export default function RequireRole({ role, children }: Props) {
  const location = useLocation();
  const token = localStorage.getItem("authToken");

  if (!token) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  const actualRole = getRoleFromToken(token);
  if (!actualRole) {
    localStorage.removeItem("authToken");
    return <Navigate to="/login" replace />;
  }

  if (actualRole !== role) {
    return <Navigate to={homeByRole[actualRole]} replace />;
  }

  return <>{children}</>;
}



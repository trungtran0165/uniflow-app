import { Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";

const StudentLayout = () => {
  return (
    <AppLayout role="student">
      <Outlet />
    </AppLayout>
  );
};

export default StudentLayout;

import { Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";

const LecturerLayout = () => {
  return (
    <AppLayout role="lecturer">
      <Outlet />
    </AppLayout>
  );
};

export default LecturerLayout;

import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ContentLoader from "@/components/common/ContentLoader";

const AdminLayout = () => {
  return (
    <AppLayout role="admin">
      <Suspense fallback={<ContentLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

export default AdminLayout;

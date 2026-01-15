import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ContentLoader from "@/components/common/ContentLoader";

const StudentLayout = () => {
  return (
    <AppLayout role="student">
      <Suspense fallback={<ContentLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

export default StudentLayout;

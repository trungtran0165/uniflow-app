import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import ContentLoader from "@/components/common/ContentLoader";

const LecturerLayout = () => {
  return (
    <AppLayout role="lecturer">
      <Suspense fallback={<ContentLoader />}>
        <Outlet />
      </Suspense>
    </AppLayout>
  );
};

export default LecturerLayout;

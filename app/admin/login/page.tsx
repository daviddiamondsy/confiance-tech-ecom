import { Suspense } from "react";
import AdminLoginPage from "./AdminLoginPage";

export default function AdminLoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-600">
          Loading...
        </div>
      }
    >
      <AdminLoginPage />
    </Suspense>
  );
}

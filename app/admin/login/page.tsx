import { redirect } from "next/navigation";
import { Suspense } from "react";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import AdminLoginPage from "./AdminLoginPage";

export default function AdminLoginRoute() {
  if (isAdminAuthenticated()) {
    redirect("/admin");
  }
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

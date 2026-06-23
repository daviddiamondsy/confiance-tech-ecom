import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  if (!isAdminAuthenticated()) {
    redirect("/admin/login");
  }

  return <AdminDashboard />;
}

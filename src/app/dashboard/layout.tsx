import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

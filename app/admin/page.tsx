import Link from "next/link";
import type { Metadata } from "next";
import { requireChatGPTUser, chatGPTSignOutPath } from "@/app/chatgpt-auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminDashboard } from "./admin-dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "KATHA Store Management",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!isAdminEmail(user.email)) {
    return (
      <main className="admin-denied">
        <h1>Admin access only</h1>
        <p>This account is not allowed to manage KATHA.</p>
        <Link href="/">Return to shop</Link>
      </main>
    );
  }
  return <AdminDashboard displayName={user.displayName} signOutHref={chatGPTSignOutPath("/")} />;
}

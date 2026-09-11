import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white no-print">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/admin" className="font-bold text-stone-900">
            Suivi Assistante Maternelle
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-stone-500">{session?.name}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}

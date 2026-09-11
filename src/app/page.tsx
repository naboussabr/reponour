import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            Suivi des presences &amp; facturation
          </h1>
          <p className="mt-2 text-stone-600">
            Application pour assistante maternelle agreee : presences, absences, conges
            et facturation mensuelle (garde, repas, entretien) partagees avec les
            parents en ligne.
          </p>
        </div>
        <Link href="/login" className="btn-primary w-full">
          Se connecter (espace assistante maternelle)
        </Link>
        <p className="text-xs text-stone-400">
          Les parents accedent a leur espace via le lien personnel transmis par
          l&apos;assistante maternelle.
        </p>
      </div>
    </main>
  );
}

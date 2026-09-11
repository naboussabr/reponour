import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import ContractForm from "./ContractForm";

export default async function ContractPage({ params }: { params: { id: string } }) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: { contract: true },
  });
  if (!child) notFound();

  return (
    <div className="max-w-2xl space-y-4">
      <Link href={`/admin/enfants/${child.id}`} className="text-sm text-stone-500 hover:underline">
        &larr; Retour a {child.firstName}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900">
        Contrat de {child.firstName} {child.lastName}
      </h1>
      <ContractForm childId={child.id} contract={child.contract} />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasParentSession } from "@/lib/auth";
import { currentYearMonth } from "@/lib/dates";
import PinGate from "./PinGate";

export default async function ParentEntryPage({ params }: { params: { token: string } }) {
  const child = await prisma.child.findUnique({ where: { accessToken: params.token } });
  if (!child || !child.active) notFound();

  const authorized = await hasParentSession(child.id);
  if (authorized) {
    const { year, month } = currentYearMonth();
    redirect(`/parent/${params.token}/${year}/${month}`);
  }

  return <PinGate token={params.token} childFirstName={child.firstName} />;
}

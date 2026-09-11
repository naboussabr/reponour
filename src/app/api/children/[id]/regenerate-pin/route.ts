import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const accessPin = generatePin();
  const child = await prisma.child.update({
    where: { id: params.id },
    data: { accessPin },
  });

  return NextResponse.json({ accessPin: child.accessPin });
}

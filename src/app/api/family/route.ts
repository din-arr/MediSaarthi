import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { readSession, SESSION_COOKIE } from "../../../lib/session";

async function userId() {
  const session = await readSession((await cookies()).get(SESSION_COOKIE)?.value);
  return session?.role === "CUSTOMER" ? session.userId : null;
}
export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  return NextResponse.json(await prisma.familyMember.findMany({ where: { userId: id }, orderBy: { createdAt: "asc" } }));
}
export async function POST(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { name?: string; relation?: string };
  if (!body.name?.trim() || !body.relation) return NextResponse.json({ error: "Name and relation are required." }, { status: 400 });
  return NextResponse.json(await prisma.familyMember.create({ data: { userId: id, name: body.name.trim(), relation: body.relation } }));
}
export async function PATCH(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { id?: string; name?: string; relation?: string };
  if (!body.id || !body.name?.trim() || !body.relation) return NextResponse.json({ error: "Name and relation are required." }, { status: 400 });
  const member = await prisma.familyMember.findFirst({ where: { id: body.id, userId: id } });
  if (!member) return NextResponse.json({ error: "Family member not found." }, { status: 404 });
  return NextResponse.json(await prisma.familyMember.update({ where: { id: body.id }, data: { name: body.name.trim(), relation: body.relation } }));
}
export async function DELETE(request: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const memberId = new URL(request.url).searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "Family member not found." }, { status: 400 });
  await prisma.familyMember.deleteMany({ where: { id: memberId, userId: id } });
  return NextResponse.json({ ok: true });
}

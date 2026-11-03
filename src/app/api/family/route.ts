import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getSession, SESSION_COOKIE } from "../../../lib/session";
import { expiredSessionResponse, prismaErrorResponse } from "../../../lib/apiErrors";

async function validSession() { return getSession((await cookies()).get(SESSION_COOKIE)?.value); }
export async function GET() {
  const session = await validSession(); const id = session?.role === "CUSTOMER" ? session.userId : null;
  if (!session) return expiredSessionResponse();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  return NextResponse.json(await prisma.familyMember.findMany({ where: { userId: id }, orderBy: { createdAt: "asc" } }));
}
export async function POST(request: Request) {
  const session = await validSession(); const id = session?.role === "CUSTOMER" ? session.userId : null;
  if (!session) return expiredSessionResponse();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { name?: string; relation?: string };
  if (!body.name?.trim() || !body.relation) return NextResponse.json({ error: "Name and relation are required." }, { status: 400 });
  try { return NextResponse.json(await prisma.familyMember.create({ data: { userId: id, name: body.name.trim(), relation: body.relation } })); } catch (error) { return prismaErrorResponse(error, "We could not save this family member."); }
}
export async function PATCH(request: Request) {
  const session = await validSession(); const id = session?.role === "CUSTOMER" ? session.userId : null;
  if (!session) return expiredSessionResponse();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const body = await request.json() as { id?: string; name?: string; relation?: string };
  if (!body.id || !body.name?.trim() || !body.relation) return NextResponse.json({ error: "Name and relation are required." }, { status: 400 });
  const member = await prisma.familyMember.findFirst({ where: { id: body.id, userId: id } });
  if (!member) return NextResponse.json({ error: "Family member not found." }, { status: 404 });
  try { return NextResponse.json(await prisma.familyMember.update({ where: { id: body.id }, data: { name: body.name.trim(), relation: body.relation } })); } catch (error) { return prismaErrorResponse(error, "We could not update this family member."); }
}
export async function DELETE(request: Request) {
  const session = await validSession(); const id = session?.role === "CUSTOMER" ? session.userId : null;
  if (!session) return expiredSessionResponse();
  if (!id) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  const memberId = new URL(request.url).searchParams.get("id");
  if (!memberId) return NextResponse.json({ error: "Family member not found." }, { status: 400 });
  await prisma.familyMember.deleteMany({ where: { id: memberId, userId: id } });
  return NextResponse.json({ ok: true });
}

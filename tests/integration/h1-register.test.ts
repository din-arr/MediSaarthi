import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { GET as h1RegisterRoute } from "../../src/app/api/pharmacist/h1-register/route";
import { makeOrder, prisma, seedWorld, signIn, type World } from "../support/db";

const h1Register = async (url: string) => (await h1RegisterRoute(new Request(`http://localhost${url}`))) as Response;
let world: World;
beforeEach(async () => { world = await seedWorld(); });

test("H1 register exports a CSV for pharmacists and ops only", async () => {
  const order = await makeOrder(world, { items: [{ productId: world.products.alprazolam.id, approvalStatus: "APPROVED" }] });
  await prisma.h1RegisterEntry.create({ data: { orderId: order.id, productId: world.products.alprazolam.id, qty: 1, prescriber: "Dr. \"Sen\"", prescriberRegNo: "WBMC-1", patient: "=HYPERLINK(1)", patientAddress: "12 Lake View, Kolkata", pharmacistId: world.users.pharmacist.id } });
  await prisma.h1RegisterEntry.create({ data: { productId: world.products.alprazolam.id, qty: 2, prescriber: "Dr. Old", patient: "Old", date: new Date(Date.now() - 200 * 86_400_000) } });

  await signIn(world.users.customer);
  assert.equal((await h1Register("/api/pharmacist/h1-register")).status, 403);
  await signIn(world.users.ops);
  const response = await h1Register("/api/pharmacist/h1-register");
  assert.equal(response.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(response.headers.get("content-disposition") ?? "", /h1-register-last-90-days\.csv/);
  const lines = (await response.text()).trim().split("\r\n");
  assert.equal(lines.length, 2);
  assert.match(lines[0], /^"Date","Order","Medicine"/);
  assert.match(lines[1], /"Alprazolam 0\.25 mg","1","'=HYPERLINK\(1\)","12 Lake View, Kolkata","Dr\. ""Sen""","WBMC-1","Ananya Roy","WB-PH-21487"/);

  await signIn(world.users.pharmacist);
  const year = (await (await h1Register("/api/pharmacist/h1-register?days=999")).text()).trim().split("\r\n");
  assert.equal(year.length, 3);
  assert.match(year[1], /"","Alprazolam 0\.25 mg","2","Old","","Dr\. Old","","",""/);
  assert.equal((await (await h1Register("/api/pharmacist/h1-register?days=abc")).text()).trim().split("\r\n").length, 2);
});

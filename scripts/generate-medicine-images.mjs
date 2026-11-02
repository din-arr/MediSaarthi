import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const imageDirectory = resolve(root, "public/images/meds");
const files = {
  tablet: "tablets.jpg",
  capsule: "capsules.jpg",
  syrup: "syrup.jpg",
  sachet: "sachet.jpg",
  inhaler: "inhaler.jpg",
  vitamins: "vitamins.jpg",
};

const available = Object.fromEntries(
  Object.entries(files)
    .filter(([, file]) => existsSync(resolve(imageDirectory, file)))
    .map(([form, file]) => [form, `/images/meds/${file}`]),
);

await mkdir(resolve(root, "src/lib"), { recursive: true });
await writeFile(
  resolve(root, "src/lib/generatedMedicineImages.ts"),
  `export const availableMedicineImages = ${JSON.stringify(available, null, 2)} as const;\n`,
);

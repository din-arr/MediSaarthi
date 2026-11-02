import type { Medicine } from "../app/data/medicines";
import { availableMedicineImages } from "./generatedMedicineImages";

export type MedicineForm = "tablet" | "capsule" | "syrup" | "inhaler" | "sachet" | "cream" | "drops" | "vitamins";

export const medicineImages: Partial<Record<MedicineForm, string>> = availableMedicineImages;

export function getMedicineForm(medicine: Pick<Medicine, "name" | "category"> & { form?: string }): MedicineForm {
  if (medicine.form && ["tablet", "capsule", "syrup", "inhaler", "sachet", "cream", "drops", "vitamins"].includes(medicine.form)) {
    return medicine.form as MedicineForm;
  }
  const value = medicine.name.toLowerCase();
  if (value.includes("inhaler")) return "inhaler";
  if (value.includes("syrup")) return "syrup";
  if (value.includes("sachet") || value.includes("ors")) return "sachet";
  if (value.includes("cream") || value.includes("gel") || value.includes("ointment")) return "cream";
  if (value.includes("drops") || value.includes("spray")) return "drops";
  if (medicine.category === "Vitamins & minerals" || value.includes("vitamin")) return "vitamins";
  if (value.includes("capsule")) return "capsule";
  return "tablet";
}

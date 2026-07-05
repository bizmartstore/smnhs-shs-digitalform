import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeHeightMeters(height_m: unknown): number | null {
  const h = Number(height_m);
  if (!Number.isFinite(h) || h <= 0) return null;
  // Values above 3 are almost certainly centimeters (e.g. 165 cm entered in the meters field).
  if (h > 3) return h / 100;
  return h;
}

export function computeBmi(height_m: unknown, weight_kg: unknown): number | null {
  const h = normalizeHeightMeters(height_m);
  const w = Number(weight_kg);
  if (!h || !w || w <= 0) return null;
  const bmi = w / (h * h);
  if (!Number.isFinite(bmi) || bmi < 1 || bmi > 80) return null;
  return bmi;
}

export function bmiCategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function roundBmi(bmi: number): number {
  return Math.round(bmi * 10) / 10;
}

export function resolveBmi(row: {
  bmi?: unknown;
  height_m?: unknown;
  weight_kg?: unknown;
}): number | null {
  const computed = computeBmi(row.height_m, row.weight_kg);
  if (computed != null) return roundBmi(computed);

  const stored = Number(row.bmi);
  if (Number.isFinite(stored) && stored >= 10 && stored <= 80) return roundBmi(stored);
  return null;
}

export function formatBmi(bmi: number): string {
  return `${bmi.toFixed(1)} kg/m²`;
}

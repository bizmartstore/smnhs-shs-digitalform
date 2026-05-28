import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function computeBmi(height_m: unknown, weight_kg: unknown): number | null {
  const h = Number(height_m);
  const w = Number(weight_kg);
  if (!h || !w || h <= 0 || w <= 0) return null;
  return w / (h * h);
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
  const stored = Number(row.bmi);
  if (Number.isFinite(stored) && stored > 0) return stored;
  return computeBmi(row.height_m, row.weight_kg);
}

export function formatBmi(bmi: number): string {
  return `${bmi.toFixed(1)} kg/m²`;
}

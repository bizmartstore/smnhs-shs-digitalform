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

export function formatHeightMeters(height_m: unknown): string | null {
  const h = normalizeHeightMeters(height_m);
  if (h == null) return null;
  return `${h.toFixed(2)} m`;
}

export function formatHeightMetersSquared(height_m: unknown): string | null {
  const h = normalizeHeightMeters(height_m);
  if (h == null) return null;
  return `${(h * h).toFixed(4)} m²`;
}

export function formatBirthdate(date_of_birth: unknown): string {
  if (!date_of_birth) return "—";
  const raw = String(date_of_birth);
  const date = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

export function resolveAgeYearsMonths(row: {
  date_of_birth?: unknown;
  age?: unknown;
}): { years: number; months: number } | null {
  if (row.date_of_birth) {
    const raw = String(row.date_of_birth);
    const dob = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      let years = today.getFullYear() - dob.getFullYear();
      let months = today.getMonth() - dob.getMonth();
      if (today.getDate() < dob.getDate()) months -= 1;
      if (months < 0) {
        years -= 1;
        months += 12;
      }
      if (years >= 0) return { years, months };
    }
  }
  const age = Number(row.age);
  if (Number.isFinite(age) && age >= 0) return { years: Math.floor(age), months: 0 };
  return null;
}

export function formatAgeYearsMonths(row: {
  date_of_birth?: unknown;
  age?: unknown;
}): string {
  const age = resolveAgeYearsMonths(row);
  if (!age) return "—";
  return `${age.years}Y, ${age.months}M`;
}

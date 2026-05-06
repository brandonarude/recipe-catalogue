import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string) {
  return str
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function formatQuantity(q: number): string {
  if (q === Math.floor(q)) return q.toString();
  const frac = q - Math.floor(q);
  const whole = Math.floor(q);
  const fractions: Record<string, string> = {
    "0.25": "¼",
    "0.33": "⅓",
    "0.5": "½",
    "0.67": "⅔",
    "0.75": "¾",
  };
  const key = frac.toFixed(2);
  if (fractions[key]) {
    return whole > 0 ? `${whole}${fractions[key]}` : fractions[key];
  }
  return q.toFixed(1);
}

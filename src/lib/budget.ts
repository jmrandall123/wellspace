import { BudgetLevel } from "@prisma/client";

export const BUDGET_LIMITS: Record<BudgetLevel, number> = {
  LOW: 1500,
  MEDIUM: 4000,
  HIGH: 10000,
};

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

export function getBudgetLimit(level: BudgetLevel): number {
  return BUDGET_LIMITS[level];
}

export function getRemainingBudget(
  level: BudgetLevel,
  wordsUsed: number
): number {
  return Math.max(0, BUDGET_LIMITS[level] - wordsUsed);
}

export function isBudgetExhausted(
  level: BudgetLevel,
  wordsUsed: number
): boolean {
  return wordsUsed >= BUDGET_LIMITS[level];
}

export function getBudgetPercentage(
  level: BudgetLevel,
  wordsUsed: number
): number {
  return Math.min(100, (wordsUsed / BUDGET_LIMITS[level]) * 100);
}

export function getReadingTime(words: number): string {
  const minutes = Math.ceil(words / 250); // Average reading speed
  if (minutes < 1) return "< 1 min";
  return `${minutes} min`;
}

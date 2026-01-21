"use client";

import { BudgetLevel } from "@prisma/client";
import {
  getBudgetLimit,
  getBudgetPercentage,
  getRemainingBudget,
  getReadingTime,
} from "@/lib/budget";

interface InfoBudgetMeterProps {
  level: BudgetLevel;
  wordsUsed: number;
}

export function InfoBudgetMeter({ level, wordsUsed }: InfoBudgetMeterProps) {
  const limit = getBudgetLimit(level);
  const remaining = getRemainingBudget(level, wordsUsed);
  const percentage = getBudgetPercentage(level, wordsUsed);
  const isExhausted = remaining === 0;

  return (
    <div className="bg-white rounded-lg border border-stone-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-stone-700">
          Daily Reading Budget
        </span>
        <span className="text-xs text-stone-500">
          {level.charAt(0) + level.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="relative h-2 bg-stone-100 rounded-full overflow-hidden mb-2">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
            isExhausted
              ? "bg-amber-500"
              : percentage > 75
              ? "bg-amber-400"
              : "bg-stone-600"
          }`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-stone-500">
        <span>
          {remaining.toLocaleString()} words left ({getReadingTime(remaining)})
        </span>
        <span>
          {wordsUsed.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>

      {isExhausted && (
        <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-800 font-medium">
            You&apos;ve reached your reading goal for today
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Come back tomorrow for fresh content, or adjust your budget in
            settings.
          </p>
        </div>
      )}
    </div>
  );
}

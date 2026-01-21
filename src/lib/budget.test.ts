import { describe, it, expect } from "vitest";
import {
  countWords,
  getBudgetLimit,
  getRemainingBudget,
  isBudgetExhausted,
  getBudgetPercentage,
  getReadingTime,
  BUDGET_LIMITS,
} from "./budget";

describe("budget utilities", () => {
  describe("BUDGET_LIMITS", () => {
    it("should have correct limits for each level", () => {
      expect(BUDGET_LIMITS.LOW).toBe(1500);
      expect(BUDGET_LIMITS.MEDIUM).toBe(4000);
      expect(BUDGET_LIMITS.HIGH).toBe(10000);
    });
  });

  describe("countWords", () => {
    it("should count words in a simple sentence", () => {
      expect(countWords("hello world")).toBe(2);
    });

    it("should handle multiple spaces", () => {
      expect(countWords("hello   world")).toBe(2);
    });

    it("should handle leading and trailing spaces", () => {
      expect(countWords("  hello world  ")).toBe(2);
    });

    it("should return 0 for empty string", () => {
      expect(countWords("")).toBe(0);
    });

    it("should return 0 for whitespace only", () => {
      expect(countWords("   ")).toBe(0);
    });

    it("should count words with newlines and tabs", () => {
      expect(countWords("hello\nworld\tthere")).toBe(3);
    });

    it("should handle a longer paragraph", () => {
      const text = "This is a test paragraph with multiple words to ensure the counting works correctly.";
      expect(countWords(text)).toBe(14);
    });
  });

  describe("getBudgetLimit", () => {
    it("should return correct limit for LOW", () => {
      expect(getBudgetLimit("LOW")).toBe(1500);
    });

    it("should return correct limit for MEDIUM", () => {
      expect(getBudgetLimit("MEDIUM")).toBe(4000);
    });

    it("should return correct limit for HIGH", () => {
      expect(getBudgetLimit("HIGH")).toBe(10000);
    });
  });

  describe("getRemainingBudget", () => {
    it("should return full budget when no words used", () => {
      expect(getRemainingBudget("LOW", 0)).toBe(1500);
      expect(getRemainingBudget("MEDIUM", 0)).toBe(4000);
      expect(getRemainingBudget("HIGH", 0)).toBe(10000);
    });

    it("should subtract words used from budget", () => {
      expect(getRemainingBudget("LOW", 500)).toBe(1000);
      expect(getRemainingBudget("MEDIUM", 1000)).toBe(3000);
    });

    it("should return 0 when budget is exactly used", () => {
      expect(getRemainingBudget("LOW", 1500)).toBe(0);
    });

    it("should return 0 when budget is exceeded (not negative)", () => {
      expect(getRemainingBudget("LOW", 2000)).toBe(0);
    });
  });

  describe("isBudgetExhausted", () => {
    it("should return false when budget not exhausted", () => {
      expect(isBudgetExhausted("LOW", 1000)).toBe(false);
      expect(isBudgetExhausted("MEDIUM", 3999)).toBe(false);
    });

    it("should return true when budget exactly met", () => {
      expect(isBudgetExhausted("LOW", 1500)).toBe(true);
      expect(isBudgetExhausted("MEDIUM", 4000)).toBe(true);
    });

    it("should return true when budget exceeded", () => {
      expect(isBudgetExhausted("LOW", 2000)).toBe(true);
      expect(isBudgetExhausted("HIGH", 15000)).toBe(true);
    });
  });

  describe("getBudgetPercentage", () => {
    it("should return 0 when no words used", () => {
      expect(getBudgetPercentage("LOW", 0)).toBe(0);
    });

    it("should return 50 when half budget used", () => {
      expect(getBudgetPercentage("LOW", 750)).toBe(50);
      expect(getBudgetPercentage("MEDIUM", 2000)).toBe(50);
    });

    it("should return 100 when budget exactly met", () => {
      expect(getBudgetPercentage("LOW", 1500)).toBe(100);
    });

    it("should cap at 100 when budget exceeded", () => {
      expect(getBudgetPercentage("LOW", 3000)).toBe(100);
    });
  });

  describe("getReadingTime", () => {
    it("should return '< 1 min' for zero words", () => {
      expect(getReadingTime(0)).toBe("< 1 min");
    });

    it("should return '1 min' for very short content", () => {
      expect(getReadingTime(100)).toBe("1 min");
    });

    it("should return '1 min' for 250 words", () => {
      expect(getReadingTime(250)).toBe("1 min");
    });

    it("should return '2 min' for 300 words", () => {
      expect(getReadingTime(300)).toBe("2 min");
    });

    it("should return '4 min' for 1000 words", () => {
      expect(getReadingTime(1000)).toBe("4 min");
    });
  });
});

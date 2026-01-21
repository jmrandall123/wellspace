import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateQualityScore,
  calculatePostScore,
  sortByScore,
  canAuthorSeeAttributes,
  PostWithAttributes,
} from "./algorithm";

describe("algorithm utilities", () => {
  describe("calculateQualityScore", () => {
    it("should return 0 for no attributes", () => {
      expect(calculateQualityScore([])).toBe(0);
    });

    it("should return positive score for INFORMATIVE", () => {
      expect(calculateQualityScore([{ attributeType: "INFORMATIVE" }])).toBe(3);
    });

    it("should return positive score for INSIGHTFUL", () => {
      expect(calculateQualityScore([{ attributeType: "INSIGHTFUL" }])).toBe(4);
    });

    it("should return positive score for WELL_WRITTEN", () => {
      expect(calculateQualityScore([{ attributeType: "WELL_WRITTEN" }])).toBe(2);
    });

    it("should return negative score for LOW_QUALITY", () => {
      expect(calculateQualityScore([{ attributeType: "LOW_QUALITY" }])).toBe(-5);
    });

    it("should return negative score for MISLEADING", () => {
      expect(calculateQualityScore([{ attributeType: "MISLEADING" }])).toBe(-8);
    });

    it("should sum multiple attributes correctly", () => {
      const attributes = [
        { attributeType: "INFORMATIVE" as const },
        { attributeType: "INSIGHTFUL" as const },
        { attributeType: "WELL_WRITTEN" as const },
      ];
      // 3 + 4 + 2 = 9
      expect(calculateQualityScore(attributes)).toBe(9);
    });

    it("should handle mixed positive and negative attributes", () => {
      const attributes = [
        { attributeType: "INFORMATIVE" as const }, // +3
        { attributeType: "LOW_QUALITY" as const }, // -5
      ];
      expect(calculateQualityScore(attributes)).toBe(-2);
    });
  });

  describe("calculatePostScore", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-21T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should give base score of 10 for new post with no attributes", () => {
      const post: PostWithAttributes = {
        id: "1",
        createdAt: new Date("2026-01-21T12:00:00Z"),
        attributes: [],
      };
      // Base score 10, no decay for brand new post
      expect(calculatePostScore(post)).toBeCloseTo(10, 1);
    });

    it("should add quality score to base score", () => {
      const post: PostWithAttributes = {
        id: "1",
        createdAt: new Date("2026-01-21T12:00:00Z"),
        attributes: [{ attributeType: "INSIGHTFUL" }],
      };
      // Base 10 + quality 4 = 14
      expect(calculatePostScore(post)).toBeCloseTo(14, 1);
    });

    it("should apply time decay to older posts", () => {
      const oneDayAgo = new Date("2026-01-20T12:00:00Z");
      const post: PostWithAttributes = {
        id: "1",
        createdAt: oneDayAgo,
        attributes: [],
      };
      const score = calculatePostScore(post);
      // Should be less than 10 due to decay
      expect(score).toBeLessThan(10);
      // ~5% decay per day, so should be around 9.5
      expect(score).toBeGreaterThan(9);
    });

    it("should apply more decay to older posts", () => {
      const oneWeekAgo = new Date("2026-01-14T12:00:00Z");
      const post: PostWithAttributes = {
        id: "1",
        createdAt: oneWeekAgo,
        attributes: [],
      };
      const score = calculatePostScore(post);
      // After 7 days, significant decay should have occurred
      expect(score).toBeLessThan(8);
    });
  });

  describe("sortByScore", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-21T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should sort posts by score descending", () => {
      const posts: PostWithAttributes[] = [
        {
          id: "1",
          createdAt: new Date("2026-01-21T12:00:00Z"),
          attributes: [],
        },
        {
          id: "2",
          createdAt: new Date("2026-01-21T12:00:00Z"),
          attributes: [{ attributeType: "INSIGHTFUL" }],
        },
        {
          id: "3",
          createdAt: new Date("2026-01-21T12:00:00Z"),
          attributes: [{ attributeType: "LOW_QUALITY" }],
        },
      ];

      const sorted = sortByScore(posts);
      expect(sorted[0].id).toBe("2"); // Highest quality
      expect(sorted[1].id).toBe("1"); // No attributes
      expect(sorted[2].id).toBe("3"); // Low quality
    });

    it("should not mutate original array", () => {
      const posts: PostWithAttributes[] = [
        {
          id: "1",
          createdAt: new Date("2026-01-21T12:00:00Z"),
          attributes: [{ attributeType: "LOW_QUALITY" }],
        },
        {
          id: "2",
          createdAt: new Date("2026-01-21T12:00:00Z"),
          attributes: [{ attributeType: "INSIGHTFUL" }],
        },
      ];

      const originalFirstId = posts[0].id;
      sortByScore(posts);
      expect(posts[0].id).toBe(originalFirstId);
    });
  });

  describe("canAuthorSeeAttributes", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-01-21T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should allow non-authors to see attributes immediately", () => {
      const postDate = new Date("2026-01-21T11:00:00Z");
      expect(canAuthorSeeAttributes(postDate, "author123", "viewer456")).toBe(true);
    });

    it("should prevent author from seeing attributes on new post", () => {
      const postDate = new Date("2026-01-21T11:00:00Z");
      expect(canAuthorSeeAttributes(postDate, "author123", "author123")).toBe(false);
    });

    it("should prevent author from seeing attributes within 1 week", () => {
      // Post from 6 days ago
      const postDate = new Date("2026-01-15T12:00:00Z");
      expect(canAuthorSeeAttributes(postDate, "author123", "author123")).toBe(false);
    });

    it("should allow author to see attributes after 1 week", () => {
      // Post from 8 days ago
      const postDate = new Date("2026-01-13T12:00:00Z");
      expect(canAuthorSeeAttributes(postDate, "author123", "author123")).toBe(true);
    });

    it("should allow author to see attributes at exactly 1 week", () => {
      // Post from exactly 7 days ago
      const postDate = new Date("2026-01-14T12:00:00Z");
      expect(canAuthorSeeAttributes(postDate, "author123", "author123")).toBe(true);
    });
  });
});

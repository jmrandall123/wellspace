import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, mockSession, resetAllMocks } from "@/test/mocks";

// Mock modules before importing route handlers
vi.mock("@/lib/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { POST, DELETE } from "./route";
import { getServerSession } from "next-auth";

describe("Attributes API", () => {
  beforeEach(() => {
    resetAllMocks();
    vi.mocked(getServerSession).mockReset();
  });

  describe("POST /api/attributes", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1", attributeType: "INFORMATIVE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when postId is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ attributeType: "INFORMATIVE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Post ID and attribute type are required");
    });

    it("should return 400 when attributeType is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Post ID and attribute type are required");
    });

    it("should return 400 for invalid attribute type", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1", attributeType: "INVALID_TYPE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid attribute type");
    });

    it("should return 404 when post does not exist", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findUnique.mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "nonexistent", attributeType: "INFORMATIVE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Post not found");
    });

    it("should return 403 when voting on own post", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findUnique.mockResolvedValue({
        id: "post-1",
        authorId: mockSession.user.id, // Same as current user
        content: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1", attributeType: "INFORMATIVE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe("Cannot vote on your own post");
    });

    it("should create attribute successfully for valid request", async () => {
      const mockAttribute = {
        id: "attr-1",
        postId: "post-1",
        userId: mockSession.user.id,
        attributeType: "INFORMATIVE",
        createdAt: new Date(),
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findUnique.mockResolvedValue({
        id: "post-1",
        authorId: "different-user", // Different from current user
        content: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.postAttribute.upsert.mockResolvedValue(mockAttribute);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1", attributeType: "INFORMATIVE" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("attr-1");
      expect(data.attributeType).toBe("INFORMATIVE");
    });

    it.each([
      "INFORMATIVE",
      "INSIGHTFUL",
      "WELL_WRITTEN",
      "LOW_QUALITY",
      "MISLEADING",
    ])("should accept valid attribute type: %s", async (attributeType) => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findUnique.mockResolvedValue({
        id: "post-1",
        authorId: "different-user",
        content: "Test",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      mockPrisma.postAttribute.upsert.mockResolvedValue({
        id: "attr-1",
        postId: "post-1",
        userId: mockSession.user.id,
        attributeType,
        createdAt: new Date(),
      });

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "POST",
        body: JSON.stringify({ postId: "post-1", attributeType }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/attributes", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "DELETE",
        body: JSON.stringify({ postId: "post-1", attributeType: "INFORMATIVE" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when postId or attributeType is missing", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "DELETE",
        body: JSON.stringify({ postId: "post-1" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Post ID and attribute type are required");
    });

    it("should delete attribute successfully", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.postAttribute.delete.mockResolvedValue({
        id: "attr-1",
        postId: "post-1",
        userId: mockSession.user.id,
        attributeType: "INFORMATIVE",
        createdAt: new Date(),
      });

      const request = new Request("http://localhost:3000/api/attributes", {
        method: "DELETE",
        body: JSON.stringify({ postId: "post-1", attributeType: "INFORMATIVE" }),
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

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

import { GET, POST } from "./route";
import { getServerSession } from "next-auth";

describe("Posts API", () => {
  beforeEach(() => {
    resetAllMocks();
    vi.mocked(getServerSession).mockReset();
  });

  describe("GET /api/posts", () => {
    it("should return posts successfully", async () => {
      const mockPosts = [
        {
          id: "post-1",
          content: "Test post content",
          authorId: "author-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: "author-1", name: "Author", image: null },
          attributes: [],
          _count: { replies: 5 },
        },
      ];

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const request = new Request("http://localhost:3000/api/posts");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.posts).toHaveLength(1);
      expect(data.posts[0].id).toBe("post-1");
      expect(data.posts[0].replyCount).toBe(5);
    });

    it("should filter by authorId when provided", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findMany.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/posts?authorId=specific-author"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { authorId: "specific-author" },
        })
      );
    });

    it("should support pagination with cursor", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findMany.mockResolvedValue([]);

      const request = new Request(
        "http://localhost:3000/api/posts?cursor=last-post-id"
      );
      await GET(request);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: "last-post-id" },
        })
      );
    });

    it("should return nextCursor when more posts exist", async () => {
      const mockPosts = Array.from({ length: 21 }, (_, i) => ({
        id: `post-${i}`,
        content: `Content ${i}`,
        authorId: "author-1",
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: "author-1", name: "Author", image: null },
        attributes: [],
        _count: { replies: 0 },
      }));

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.findMany.mockResolvedValue(mockPosts);

      const request = new Request("http://localhost:3000/api/posts?limit=20");
      const response = await GET(request);
      const data = await response.json();

      expect(data.posts).toHaveLength(20);
      expect(data.nextCursor).toBe("post-20");
    });
  });

  describe("POST /api/posts", () => {
    it("should return 401 when not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: "Test post" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 when content is empty", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: "" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content is required");
    });

    it("should return 400 when content is whitespace only", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: "   " }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content is required");
    });

    it("should return 400 when content exceeds max length", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);

      const longContent = "a".repeat(10001);
      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: longContent }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Content too long (max 10,000 characters)");
    });

    it("should create post successfully with valid content", async () => {
      const mockCreatedPost = {
        id: "new-post-id",
        content: "Test post content",
        authorId: mockSession.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: {
          id: mockSession.user.id,
          name: mockSession.user.name,
          image: null,
        },
      };

      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.create.mockResolvedValue(mockCreatedPost);

      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: "Test post content" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe("new-post-id");
      expect(data.content).toBe("Test post content");
    });

    it("should trim whitespace from content", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession);
      mockPrisma.post.create.mockResolvedValue({
        id: "new-post-id",
        content: "Test content",
        authorId: mockSession.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        author: { id: mockSession.user.id, name: "Test", image: null },
      });

      const request = new Request("http://localhost:3000/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: "  Test content  " }),
      });

      await POST(request);

      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: "Test content",
          }),
        })
      );
    });
  });
});

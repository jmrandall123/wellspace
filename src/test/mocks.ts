import { vi } from "vitest";

// Mock Prisma client
export const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  post: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reply: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  follow: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  postAttribute: {
    findFirst: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    groupBy: vi.fn(),
    upsert: vi.fn(),
  },
  budgetUsage: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
};

// Mock session data
export const mockSession = {
  user: {
    id: "user-123",
    name: "Test User",
    email: "test@example.com",
    image: null,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

export const mockUnauthenticated = null;

// Reset all mocks
export function resetAllMocks() {
  Object.values(mockPrisma).forEach((model) => {
    Object.values(model).forEach((method) => {
      if (typeof method === "function" && "mockReset" in method) {
        (method as ReturnType<typeof vi.fn>).mockReset();
      }
    });
  });
}

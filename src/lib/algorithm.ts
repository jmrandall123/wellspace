import { AttributeType } from "@prisma/client";

// Weights for different attribute types
const ATTRIBUTE_WEIGHTS: Record<AttributeType, number> = {
  INFORMATIVE: 3,
  INSIGHTFUL: 4,
  WELL_WRITTEN: 2,
  LOW_QUALITY: -5,
  MISLEADING: -8,
};

export interface PostWithAttributes {
  id: string;
  createdAt: Date;
  attributes: { attributeType: AttributeType }[];
}

export function calculateQualityScore(
  attributes: { attributeType: AttributeType }[]
): number {
  return attributes.reduce((score, attr) => {
    return score + (ATTRIBUTE_WEIGHTS[attr.attributeType] || 0);
  }, 0);
}

export function calculatePostScore(post: PostWithAttributes): number {
  const qualityScore = calculateQualityScore(post.attributes);

  // Time decay factor - posts lose relevance over time
  const hoursOld =
    (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
  const timeDecay = Math.pow(0.95, hoursOld / 24); // ~5% decay per day

  // Base score ensures new posts get some visibility
  const baseScore = 10;

  return (baseScore + qualityScore) * timeDecay;
}

export function sortByScore<T extends PostWithAttributes>(posts: T[]): T[] {
  return [...posts].sort((a, b) => calculatePostScore(b) - calculatePostScore(a));
}

// Check if a post's attributes should be visible to its author
// (1 week delay for own posts)
export function canAuthorSeeAttributes(
  postCreatedAt: Date,
  authorId: string,
  viewerId: string
): boolean {
  if (authorId !== viewerId) return true;

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const postAge = Date.now() - postCreatedAt.getTime();

  return postAge >= oneWeekMs;
}

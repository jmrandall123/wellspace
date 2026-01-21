"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { PostCard } from "./PostCard";
import { InfoBudgetMeter } from "./InfoBudgetMeter";
import { BudgetLevel } from "@prisma/client";
import { isBudgetExhausted } from "@/lib/budget";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Post {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  replyCount: number;
  attributes: { attributeType: string }[];
}

interface FeedProps {
  feedType?: "all" | "following";
  authorId?: string;
}

export function Feed({ feedType = "all", authorId }: FeedProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("MEDIUM");
  const [wordsUsed, setWordsUsed] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchBudget = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/budget");
      if (res.ok) {
        const data = await res.json();
        setBudgetLevel(data.budgetLevel);
        setWordsUsed(data.wordsUsed);
      }
    } catch (error) {
      console.error("Error fetching budget:", error);
    }
  }, [session?.user?.id]);

  const fetchPosts = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (authorId) params.set("authorId", authorId);
      if (feedType) params.set("feed", feedType);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/posts?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (cursor) {
          setPosts((prev) => [...prev, ...data.posts]);
        } else {
          setPosts(data.posts);
        }
        setNextCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [authorId, feedType]);

  useEffect(() => {
    fetchBudget();
    fetchPosts();
  }, [fetchBudget, fetchPosts]);

  const handleExpand = async (wordCount: number) => {
    if (!session?.user?.id) return;

    try {
      const res = await fetch("/api/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wordsToAdd: wordCount }),
      });
      if (res.ok) {
        const data = await res.json();
        setWordsUsed(data.wordsUsed);
      }
    } catch (error) {
      console.error("Error updating budget:", error);
    }
  };

  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true);
      fetchPosts(nextCursor);
    }
  };

  const budgetExhausted = session?.user?.id && isBudgetExhausted(budgetLevel, wordsUsed);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-stone-200 p-5 animate-pulse"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-stone-200" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-stone-200 rounded" />
                <div className="h-3 w-16 bg-stone-100 rounded" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-stone-100 rounded" />
              <div className="h-4 w-3/4 bg-stone-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {session?.user?.id && !authorId && (
        <InfoBudgetMeter level={budgetLevel} wordsUsed={wordsUsed} />
      )}

      {budgetExhausted ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-serif font-medium text-stone-800 mb-2">
            You&apos;ve reached your daily reading goal
          </h2>
          <p className="text-stone-600">
            Come back tomorrow for fresh content, or adjust your budget in settings.
          </p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-stone-200">
          <h2 className="text-xl font-serif font-medium text-stone-800 mb-2">
            {feedType === "following"
              ? "No posts from people you follow"
              : "No posts yet"}
          </h2>
          <p className="text-stone-600">
            {feedType === "following"
              ? "Follow some users to see their posts here."
              : "Be the first to share your thoughts."}
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              content={post.content}
              author={post.author}
              createdAt={new Date(post.createdAt)}
              replyCount={post.replyCount}
              attributes={post.attributes}
              currentUserId={session?.user?.id}
              onExpand={handleExpand}
            />
          ))}

          {nextCursor && !budgetExhausted && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3 text-stone-600 hover:text-stone-800 text-sm font-medium transition-gentle disabled:opacity-50"
            >
              {loadingMore ? "Loading..." : "Load more posts"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

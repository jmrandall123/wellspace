"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PostComposerProps {
  onPost?: () => void;
}

export function PostComposer({ onPost }: PostComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create post");
      }

      setContent("");
      setIsExpanded(false);
      router.refresh();
      if (onPost) onPost();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const charCount = content.length;
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <form onSubmit={handleSubmit}>
        <div className="p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            placeholder="Share your thoughts..."
            className="w-full resize-none border-0 focus:ring-0 text-stone-800 placeholder-stone-400 text-base min-h-[60px]"
            rows={isExpanded ? 6 : 2}
            maxLength={10000}
          />
        </div>

        {isExpanded && (
          <>
            <div className="px-4 pb-2">
              <div className="text-xs text-stone-500 space-y-1">
                <p>
                  <strong>Formatting tips:</strong> Use **bold**, *italic*, and
                  # ## ### for headers
                </p>
              </div>
            </div>

            {error && (
              <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
              <div className="text-xs text-stone-500">
                {wordCount} words · {charCount.toLocaleString()} / 10,000
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsExpanded(false);
                    setContent("");
                    setError("");
                  }}
                  className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800 transition-gentle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!content.trim() || loading}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-gentle disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Posting..." : "Post"}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

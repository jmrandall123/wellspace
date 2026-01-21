"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ReplyFormProps {
  postId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
}

export function ReplyForm({
  postId,
  parentId,
  onCancel,
  onSuccess,
  placeholder = "Write a reply...",
}: ReplyFormProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          content: content.trim(),
          parentId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post reply");
      }

      setContent("");
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 resize-none border-0 focus:ring-0 text-stone-800 placeholder-stone-400"
          rows={3}
          maxLength={5000}
        />

        {error && (
          <div className="mx-4 mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="px-4 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            {content.length.toLocaleString()} / 5,000
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-800 transition-gentle"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || loading}
              className="px-4 py-1.5 text-sm font-medium text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-gentle disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Posting..." : "Reply"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

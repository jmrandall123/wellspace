"use client";

import { useState } from "react";

const POSITIVE_ATTRIBUTES = [
  { type: "INFORMATIVE", label: "Informative", emoji: "📚" },
  { type: "INSIGHTFUL", label: "Insightful", emoji: "💡" },
  { type: "WELL_WRITTEN", label: "Well-written", emoji: "✍️" },
];

const NEGATIVE_ATTRIBUTES = [
  { type: "LOW_QUALITY", label: "Low quality", emoji: "👎" },
  { type: "MISLEADING", label: "Misleading", emoji: "⚠️" },
];

interface PostAttribute {
  attributeType: string;
}

interface AttributeVoterProps {
  postId: string;
  attributes: PostAttribute[];
  currentUserId: string;
}

export function AttributeVoter({
  postId,
  attributes,
  currentUserId,
}: AttributeVoterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localAttributes, setLocalAttributes] =
    useState<PostAttribute[]>(attributes);
  const [loading, setLoading] = useState(false);

  const hasVoted = (type: string) =>
    localAttributes.some((a) => a.attributeType === type);

  const handleVote = async (type: string) => {
    if (loading) return;
    setLoading(true);

    const isRemoving = hasVoted(type);

    try {
      const res = await fetch("/api/attributes", {
        method: isRemoving ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, attributeType: type }),
      });

      if (res.ok) {
        if (isRemoving) {
          setLocalAttributes((prev) =>
            prev.filter((a) => a.attributeType !== type)
          );
        } else {
          setLocalAttributes((prev) => [...prev, { attributeType: type }]);
        }
      }
    } catch (error) {
      console.error("Vote error:", error);
    } finally {
      setLoading(false);
    }
  };

  const voteCount = localAttributes.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 text-sm transition-gentle ${
          voteCount > 0
            ? "text-stone-700 font-medium"
            : "text-stone-500 hover:text-stone-700"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          />
        </svg>
        <span>{voteCount > 0 ? `${voteCount} tags` : "Add tags"}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-lg shadow-lg border border-stone-200 p-3 z-20">
            <div className="text-xs font-medium text-stone-500 mb-2">
              Positive
            </div>
            <div className="space-y-1 mb-3">
              {POSITIVE_ATTRIBUTES.map((attr) => (
                <button
                  key={attr.type}
                  onClick={() => handleVote(attr.type)}
                  disabled={loading}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-gentle ${
                    hasVoted(attr.type)
                      ? "bg-green-100 text-green-800"
                      : "hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span>{attr.emoji}</span>
                  <span>{attr.label}</span>
                  {hasVoted(attr.type) && (
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <div className="text-xs font-medium text-stone-500 mb-2">
              Negative
            </div>
            <div className="space-y-1">
              {NEGATIVE_ATTRIBUTES.map((attr) => (
                <button
                  key={attr.type}
                  onClick={() => handleVote(attr.type)}
                  disabled={loading}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-gentle ${
                    hasVoted(attr.type)
                      ? "bg-red-100 text-red-800"
                      : "hover:bg-stone-50 text-stone-700"
                  }`}
                >
                  <span>{attr.emoji}</span>
                  <span>{attr.label}</span>
                  {hasVoted(attr.type) && (
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

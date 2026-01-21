"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AttributeVoter } from "./AttributeVoter";
import { countWords } from "@/lib/budget";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface PostAttribute {
  attributeType: string;
}

interface PostCardProps {
  id: string;
  content: string;
  author: Author;
  createdAt: Date;
  replyCount?: number;
  attributes?: PostAttribute[];
  showAttributes?: boolean;
  currentUserId?: string;
  onExpand?: (wordCount: number) => void;
  isPreview?: boolean;
}

const PREVIEW_LENGTH = 280;

export function PostCard({
  id,
  content,
  author,
  createdAt,
  replyCount = 0,
  attributes = [],
  showAttributes = true,
  currentUserId,
  onExpand,
  isPreview = true,
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(!isPreview);
  const needsExpand = content.length > PREVIEW_LENGTH && isPreview;
  const displayContent = needsExpand && !isExpanded
    ? content.slice(0, PREVIEW_LENGTH).trim() + "..."
    : content;

  const handleExpand = () => {
    if (!isExpanded && needsExpand) {
      setIsExpanded(true);
      if (onExpand) {
        onExpand(countWords(content));
      }
    }
  };

  const formatContent = (text: string) => {
    // Simple markdown-like formatting
    return text
      .split("\n")
      .map((line, i) => {
        // Headers
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="text-lg font-semibold mt-4 mb-2 font-sans">
              {line.slice(4)}
            </h3>
          );
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="text-xl font-semibold mt-4 mb-2 font-sans">
              {line.slice(3)}
            </h2>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="text-2xl font-semibold mt-4 mb-2 font-sans">
              {line.slice(2)}
            </h1>
          );
        }
        // Empty lines
        if (line.trim() === "") {
          return <br key={i} />;
        }
        // Regular paragraphs with inline formatting
        let formattedLine: React.ReactNode = line;
        // Bold
        const boldParts = line.split(/\*\*(.*?)\*\*/g);
        if (boldParts.length > 1) {
          formattedLine = boldParts.map((part, j) =>
            j % 2 === 1 ? <strong key={j}>{part}</strong> : part
          );
        }
        // Italic (after handling bold to avoid conflicts)
        // This is simplified - a real implementation would use a proper parser
        return (
          <p key={i} className="mb-3">
            {formattedLine}
          </p>
        );
      });
  };

  return (
    <article className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      <div className="p-5">
        {/* Author header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/profile/${author.id}`}>
            {author.image ? (
              <img
                src={author.image}
                alt={author.name || "Author"}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 font-medium">
                {author.name?.charAt(0) || "?"}
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${author.id}`}
              className="font-medium text-stone-800 hover:underline block truncate"
            >
              {author.name || "Anonymous"}
            </Link>
            <span className="text-sm text-stone-500">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className={`prose-reader ${
            isExpanded ? "" : "line-clamp-none"
          }`}
        >
          {formatContent(displayContent)}
        </div>

        {/* Expand button */}
        {needsExpand && !isExpanded && (
          <button
            onClick={handleExpand}
            className="mt-2 text-stone-600 hover:text-stone-800 text-sm font-medium transition-gentle"
          >
            Continue reading... ({countWords(content)} words)
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
        <Link
          href={`/post/${id}`}
          className="text-sm text-stone-500 hover:text-stone-700 transition-gentle"
        >
          {replyCount} {replyCount === 1 ? "reply" : "replies"}
        </Link>

        {showAttributes && currentUserId && currentUserId !== author.id && (
          <AttributeVoter
            postId={id}
            attributes={attributes}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </article>
  );
}

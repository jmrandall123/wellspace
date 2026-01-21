"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ReplyForm } from "./ReplyForm";

interface Author {
  id: string;
  name: string | null;
  image: string | null;
}

interface Reply {
  id: string;
  content: string;
  author: Author;
  createdAt: Date;
  children?: Reply[];
}

interface ReplyCardProps {
  reply: Reply;
  postId: string;
  currentUserId?: string;
  depth?: number;
}

export function ReplyCard({
  reply,
  postId,
  currentUserId,
  depth = 0,
}: ReplyCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  return (
    <div className={depth > 0 ? "ml-6 border-l-2 border-stone-100 pl-4" : ""}>
      <div className="bg-white rounded-lg border border-stone-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/profile/${reply.author.id}`}>
            {reply.author.image ? (
              <img
                src={reply.author.image}
                alt={reply.author.name || "Author"}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-sm font-medium">
                {reply.author.name?.charAt(0) || "?"}
              </div>
            )}
          </Link>
          <div>
            <Link
              href={`/profile/${reply.author.id}`}
              className="font-medium text-stone-800 hover:underline text-sm"
            >
              {reply.author.name || "Anonymous"}
            </Link>
            <span className="text-xs text-stone-500 ml-2">
              {formatDistanceToNow(new Date(reply.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>

        <div className="text-stone-700 whitespace-pre-wrap">{reply.content}</div>

        {currentUserId && depth < 2 && (
          <div className="mt-3 pt-3 border-t border-stone-100">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="text-sm text-stone-500 hover:text-stone-700 transition-gentle"
            >
              {showReplyForm ? "Cancel" : "Reply"}
            </button>
          </div>
        )}

        {showReplyForm && (
          <div className="mt-3">
            <ReplyForm
              postId={postId}
              parentId={reply.id}
              onCancel={() => setShowReplyForm(false)}
              onSuccess={() => setShowReplyForm(false)}
              placeholder={`Reply to ${reply.author.name || "this comment"}...`}
            />
          </div>
        )}
      </div>

      {/* Nested replies */}
      {reply.children && reply.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {reply.children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              postId={postId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

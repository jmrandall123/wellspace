import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import { PostCard } from "@/components/PostCard";
import { ReplyForm } from "@/components/ReplyForm";
import { ReplyCard } from "@/components/ReplyCard";
import { canAuthorSeeAttributes } from "@/lib/algorithm";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attributes: true,
      replies: {
        where: { parentId: null }, // Top-level replies only
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          children: {
            orderBy: { createdAt: "asc" },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  // Determine if author can see attributes
  const showAttributes = session?.user?.id
    ? canAuthorSeeAttributes(post.createdAt, post.authorId, session.user.id)
    : true;

  // Filter attributes for display
  let displayAttributes = post.attributes;
  if (session?.user?.id) {
    if (post.authorId === session.user.id && !showAttributes) {
      displayAttributes = [];
    } else if (post.authorId !== session.user.id) {
      displayAttributes = post.attributes.filter(
        (a) => a.userId === session.user.id
      );
    }
  } else {
    displayAttributes = [];
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-stone-600 hover:text-stone-800 mb-6 text-sm transition-gentle"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to feed
        </Link>

        <PostCard
          id={post.id}
          content={post.content}
          author={post.author}
          createdAt={post.createdAt}
          replyCount={post._count.replies}
          attributes={displayAttributes.map((a) => ({
            attributeType: a.attributeType,
          }))}
          showAttributes={showAttributes}
          currentUserId={session?.user?.id}
          isPreview={false}
        />

        {/* Attribute visibility notice for author */}
        {session?.user?.id === post.authorId && !showAttributes && (
          <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
            <p className="text-sm text-stone-600">
              <strong>Quality attributes are hidden</strong> — You&apos;ll be
              able to see how others tagged this post after 1 week. This helps
              reduce the urge to check for feedback.
            </p>
          </div>
        )}

        {/* Replies Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-stone-800 mb-4">
            {post._count.replies} {post._count.replies === 1 ? "Reply" : "Replies"}
          </h2>

          {session?.user?.id && (
            <div className="mb-6">
              <ReplyForm postId={post.id} />
            </div>
          )}

          {post.replies.length > 0 ? (
            <div className="space-y-4">
              {post.replies.map((reply) => (
                <ReplyCard
                  key={reply.id}
                  reply={reply}
                  postId={post.id}
                  currentUserId={session?.user?.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-500">
              {session?.user?.id
                ? "Be the first to reply to this post."
                : "Sign in to join the conversation."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

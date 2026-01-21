import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/Header";
import { Feed } from "@/components/Feed";
import { FollowButton } from "@/components/FollowButton";
import { formatDistanceToNow } from "date-fns";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          followers: true,
          following: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Check if current user follows this profile
  let isFollowing = false;
  if (session?.user?.id && session.user.id !== id) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: id,
        },
      },
    });
    isFollowing = !!follow;
  }

  const isOwnProfile = session?.user?.id === id;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-stone-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name || "Profile"}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-2xl font-medium">
                {user.name?.charAt(0) || user.email?.charAt(0) || "?"}
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-serif font-semibold text-stone-800 truncate">
                    {user.name || "Anonymous"}
                  </h1>
                  <p className="text-stone-500 text-sm">
                    Joined{" "}
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>

                {session?.user?.id && !isOwnProfile && (
                  <FollowButton
                    userId={id}
                    initialIsFollowing={isFollowing}
                  />
                )}
              </div>

              {user.bio && (
                <p className="mt-3 text-stone-700">{user.bio}</p>
              )}

              <div className="flex gap-6 mt-4 text-sm">
                <div>
                  <span className="font-medium text-stone-800">
                    {user._count.posts}
                  </span>{" "}
                  <span className="text-stone-500">posts</span>
                </div>
                <div>
                  <span className="font-medium text-stone-800">
                    {user._count.followers}
                  </span>{" "}
                  <span className="text-stone-500">followers</span>
                </div>
                <div>
                  <span className="font-medium text-stone-800">
                    {user._count.following}
                  </span>{" "}
                  <span className="text-stone-500">following</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User's Posts */}
        <div className="border-b border-stone-200 pb-4 mb-6">
          <h2 className="text-lg font-medium text-stone-800">Posts</h2>
        </div>

        <Feed authorId={id} />
      </main>
    </div>
  );
}

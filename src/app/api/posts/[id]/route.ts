import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAuthorSeeAttributes } from "@/lib/algorithm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if author can see attributes
    const showAttributes = session?.user?.id
      ? canAuthorSeeAttributes(
          post.createdAt,
          post.authorId,
          session.user.id
        )
      : true;

    // Filter to only user's own attributes if not author
    let filteredAttributes = post.attributes;
    if (session?.user?.id) {
      if (post.authorId === session.user.id && !showAttributes) {
        // Author can't see any attributes yet
        filteredAttributes = [];
      } else if (post.authorId !== session.user.id) {
        // Non-author only sees their own votes
        filteredAttributes = post.attributes.filter(
          (a) => a.userId === session.user.id
        );
      }
    } else {
      filteredAttributes = [];
    }

    return NextResponse.json({
      ...post,
      attributes: filteredAttributes,
      replyCount: post._count.replies,
      showAttributes,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

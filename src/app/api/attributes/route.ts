import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AttributeType } from "@prisma/client";

const VALID_ATTRIBUTES: AttributeType[] = [
  "INFORMATIVE",
  "INSIGHTFUL",
  "WELL_WRITTEN",
  "LOW_QUALITY",
  "MISLEADING",
];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, attributeType } = await request.json();

    if (!postId || !attributeType) {
      return NextResponse.json(
        { error: "Post ID and attribute type are required" },
        { status: 400 }
      );
    }

    if (!VALID_ATTRIBUTES.includes(attributeType)) {
      return NextResponse.json(
        { error: "Invalid attribute type" },
        { status: 400 }
      );
    }

    // Check if post exists and user is not the author
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.authorId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot vote on your own post" },
        { status: 403 }
      );
    }

    // Create or update the attribute
    const attribute = await prisma.postAttribute.upsert({
      where: {
        postId_userId_attributeType: {
          postId,
          userId: session.user.id,
          attributeType,
        },
      },
      update: {},
      create: {
        postId,
        userId: session.user.id,
        attributeType,
      },
    });

    return NextResponse.json(attribute);
  } catch (error) {
    console.error("Error creating attribute:", error);
    return NextResponse.json(
      { error: "Failed to create attribute" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId, attributeType } = await request.json();

    if (!postId || !attributeType) {
      return NextResponse.json(
        { error: "Post ID and attribute type are required" },
        { status: 400 }
      );
    }

    await prisma.postAttribute.delete({
      where: {
        postId_userId_attributeType: {
          postId,
          userId: session.user.id,
          attributeType,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting attribute:", error);
    return NextResponse.json(
      { error: "Failed to delete attribute" },
      { status: 500 }
    );
  }
}

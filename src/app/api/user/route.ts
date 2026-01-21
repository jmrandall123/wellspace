import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { BudgetLevel } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        infoBudgetPreference: true,
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      postCount: user._count.posts,
      followerCount: user._count.followers,
      followingCount: user._count.following,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, bio, infoBudgetPreference } = body;

    const updateData: {
      name?: string;
      bio?: string;
      infoBudgetPreference?: BudgetLevel;
    } = {};

    if (name !== undefined) {
      if (name.length > 100) {
        return NextResponse.json(
          { error: "Name too long (max 100 characters)" },
          { status: 400 }
        );
      }
      updateData.name = name;
    }

    if (bio !== undefined) {
      if (bio.length > 500) {
        return NextResponse.json(
          { error: "Bio too long (max 500 characters)" },
          { status: 400 }
        );
      }
      updateData.bio = bio;
    }

    if (infoBudgetPreference !== undefined) {
      if (!["LOW", "MEDIUM", "HIGH"].includes(infoBudgetPreference)) {
        return NextResponse.json(
          { error: "Invalid budget preference" },
          { status: 400 }
        );
      }
      updateData.infoBudgetPreference = infoBudgetPreference as BudgetLevel;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        bio: true,
        infoBudgetPreference: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

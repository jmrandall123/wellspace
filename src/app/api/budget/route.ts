import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = getToday();

    // Get or create today's budget usage
    let budgetUsage = await prisma.budgetUsage.findUnique({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
    });

    if (!budgetUsage) {
      budgetUsage = await prisma.budgetUsage.create({
        data: {
          userId: session.user.id,
          date: today,
          wordsUsed: 0,
        },
      });
    }

    // Get user's budget preference
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { infoBudgetPreference: true },
    });

    return NextResponse.json({
      wordsUsed: budgetUsage.wordsUsed,
      budgetLevel: user?.infoBudgetPreference || "MEDIUM",
    });
  } catch (error) {
    console.error("Error fetching budget:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { wordsToAdd } = await request.json();

    if (typeof wordsToAdd !== "number" || wordsToAdd < 0) {
      return NextResponse.json(
        { error: "Invalid words count" },
        { status: 400 }
      );
    }

    const today = getToday();

    // Upsert today's budget usage
    const budgetUsage = await prisma.budgetUsage.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      update: {
        wordsUsed: {
          increment: wordsToAdd,
        },
      },
      create: {
        userId: session.user.id,
        date: today,
        wordsUsed: wordsToAdd,
      },
    });

    return NextResponse.json({ wordsUsed: budgetUsage.wordsUsed });
  } catch (error) {
    console.error("Error updating budget:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}

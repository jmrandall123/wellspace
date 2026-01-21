import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Header } from "@/components/Header";
import { Feed } from "@/components/Feed";
import { PostComposer } from "@/components/PostComposer";
import Link from "next/link";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {session ? (
          <div className="space-y-6">
            <PostComposer />

            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h1 className="text-xl font-serif font-medium text-stone-800">
                Your Feed
              </h1>
              <div className="flex gap-4 text-sm">
                <Link
                  href="/"
                  className="text-stone-800 font-medium"
                >
                  All
                </Link>
                <Link
                  href="/?feed=following"
                  className="text-stone-500 hover:text-stone-800 transition-gentle"
                >
                  Following
                </Link>
              </div>
            </div>

            <Feed />
          </div>
        ) : (
          <div className="py-16 text-center">
            <h1 className="text-4xl font-serif font-semibold text-stone-800 mb-4">
              Wellspace
            </h1>
            <p className="text-xl text-stone-600 mb-2">Read with intention</p>
            <p className="text-stone-500 max-w-md mx-auto mb-8">
              A text-only social platform designed for quality over quantity.
              Reduce doom-scrolling, discover ideas that matter.
            </p>

            <div className="space-y-4">
              <Link
                href="/login"
                className="inline-block px-6 py-3 text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-gentle"
              >
                Get Started
              </Link>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3 text-left">
              <div className="p-6 bg-white rounded-lg border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-2">
                  Information Budget
                </h3>
                <p className="text-sm text-stone-600">
                  Choose your daily intake level. Once you&apos;ve reached your goal,
                  take a break until tomorrow.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-2">
                  Quality Attributes
                </h3>
                <p className="text-sm text-stone-600">
                  Tag posts as Informative, Insightful, or Well-written. No
                  vanity metrics—just substance.
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg border border-stone-200">
                <h3 className="font-medium text-stone-800 mb-2">
                  E-Reader Experience
                </h3>
                <p className="text-sm text-stone-600">
                  Clean typography and generous whitespace. Long-form content
                  that&apos;s a pleasure to read.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

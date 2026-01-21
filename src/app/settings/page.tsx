"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { BudgetLevel } from "@prisma/client";
import { BUDGET_LIMITS, getReadingTime } from "@/lib/budget";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("MEDIUM");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setBio(data.bio || "");
        setBudgetLevel(data.infoBudgetPreference || "MEDIUM");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, infoBudgetPreference: budgetLevel }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-32 bg-stone-200 rounded" />
            <div className="h-64 bg-stone-100 rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-serif font-semibold text-stone-800 mb-6">
          Settings
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h2 className="text-lg font-medium text-stone-800 mb-4">Profile</h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent"
                  maxLength={100}
                />
              </div>

              <div>
                <label
                  htmlFor="bio"
                  className="block text-sm font-medium text-stone-700 mb-1"
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-stone-500 focus:border-transparent resize-none"
                  rows={3}
                  maxLength={500}
                  placeholder="Tell others about yourself..."
                />
                <p className="text-xs text-stone-500 mt-1">
                  {bio.length} / 500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Information Budget Section */}
          <div className="bg-white rounded-lg border border-stone-200 p-6">
            <h2 className="text-lg font-medium text-stone-800 mb-2">
              Information Budget
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              Choose how much content you want to consume daily. Your budget
              resets at midnight.
            </p>

            <div className="space-y-3">
              {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
                <label
                  key={level}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-gentle ${
                    budgetLevel === level
                      ? "border-stone-800 bg-stone-50"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="budgetLevel"
                      value={level}
                      checked={budgetLevel === level}
                      onChange={() => setBudgetLevel(level)}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        budgetLevel === level
                          ? "border-stone-800"
                          : "border-stone-300"
                      }`}
                    >
                      {budgetLevel === level && (
                        <div className="w-2 h-2 rounded-full bg-stone-800" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-stone-800">
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </span>
                      <span className="text-stone-500 ml-2">
                        {BUDGET_LIMITS[level].toLocaleString()} words
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-stone-500">
                    ~{getReadingTime(BUDGET_LIMITS[level])} reading
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <div>
              {success && (
                <span className="text-green-600 text-sm">
                  Settings saved successfully!
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 text-white bg-stone-800 rounded-lg hover:bg-stone-700 transition-gentle disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

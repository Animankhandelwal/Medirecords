"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo, BrandPanel } from "@/components/auth/brand-panel";
import { ArrowRight } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register({ email, password, full_name: fullName });
      setToken(res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <BrandPanel />
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start organizing your medical history.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Full name</label>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
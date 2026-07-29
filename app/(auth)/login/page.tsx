"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { GuestRoute } from "@/components/auth/GuestRoute";
import { useAuth } from "@/core/hooks/useAuth";

// MARK: - Login Page

export default function LoginPage() {
  const router = useRouter();

  const {
    signIn,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [rememberSession, setRememberSession] =
    useState(true);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // MARK: - Submit

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return;
    }

    clearError();
    setIsSubmitting(true);

    try {
      await signIn({
        email: normalizedEmail,
        password,
        rememberSession,
      });

      router.replace("/dashboard");
    } catch {
      // The AuthProvider already converts and stores
      // the Firebase authentication error message.
    } finally {
      setIsSubmitting(false);
    }
  }

  // MARK: - View

  return (
    <GuestRoute>
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center">
          <section className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900 lg:grid-cols-2">
            {/* MARK: Brand Panel */}

            <div className="relative hidden min-h-[680px] overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.22),transparent_40%)]"
              />

              <div className="relative z-10">
                <div className="mb-10 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-xl font-bold backdrop-blur">
                  JCS
                </div>

                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-sky-300">
                  JCS Business Suite
                </p>

                <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight">
                  One connected platform for your entire business.
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                  Manage sales, customers, employees,
                  inventory, payments, operations, reports,
                  and business growth from one secure
                  workspace.
                </p>
              </div>

              <div className="relative z-10 grid gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="font-semibold">
                    Secure business access
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Your account, business context, roles,
                    permissions, and modules remain connected
                    through Firebase.
                  </p>
                </div>

                <p className="text-sm text-slate-400">
                  Built for iPhone, iPad, Mac, Windows,
                  Android, and the web.
                </p>
              </div>
            </div>

            {/* MARK: Login Form */}

            <div className="flex min-h-[680px] items-center p-6 sm:p-10 lg:p-14">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-10 lg:hidden">
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
                    JCS
                  </div>

                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">
                    JCS Business Suite
                  </p>
                </div>

                <div className="mb-8">
                  <h2 className="text-3xl font-semibold tracking-tight">
                    Welcome back
                  </h2>

                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                    Sign in to open your business workspace.
                  </p>
                </div>

                <form
                  className="space-y-5"
                  onSubmit={handleSubmit}
                >
                  {/* Email */}

                  <div>
                    <label
                      className="mb-2 block text-sm font-medium"
                      htmlFor="email"
                    >
                      Email address
                    </label>

                    <input
                      autoComplete="email"
                      autoFocus
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:placeholder:text-slate-600"
                      disabled={isSubmitting}
                      id="email"
                      inputMode="email"
                      name="email"
                      onChange={(event) => {
                        setEmail(event.target.value);

                        if (error) {
                          clearError();
                        }
                      }}
                      placeholder="name@company.com"
                      required
                      type="email"
                      value={email}
                    />
                  </div>

                  {/* Password */}

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label
                        className="block text-sm font-medium"
                        htmlFor="password"
                      >
                        Password
                      </label>

                      <Link
                        className="text-sm font-medium text-sky-600 transition hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                        href="/forgot-password"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <input
                      autoComplete="current-password"
                      className="h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-950 dark:placeholder:text-slate-600"
                      disabled={isSubmitting}
                      id="password"
                      name="password"
                      onChange={(event) => {
                        setPassword(event.target.value);

                        if (error) {
                          clearError();
                        }
                      }}
                      placeholder="Enter your password"
                      required
                      type="password"
                      value={password}
                    />
                  </div>

                  {/* Remember Session */}

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      checked={rememberSession}
                      className="h-4 w-4 rounded border-slate-300 accent-sky-600"
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setRememberSession(
                          event.target.checked
                        )
                      }
                      type="checkbox"
                    />

                    Keep me signed in on this device
                  </label>

                  {/* Error */}

                  {error ? (
                    <div
                      aria-live="polite"
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
                      role="alert"
                    >
                      {error}
                    </div>
                  ) : null}

                  {/* Submit */}

                  <button
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                    disabled={
                      isSubmitting ||
                      !email.trim() ||
                      !password
                    }
                    type="submit"
                  >
                    {isSubmitting
                      ? "Signing in..."
                      : "Sign in"}
                  </button>
                </form>

                <div className="my-8 flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />

                  <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                    New to JCS?
                  </span>

                  <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                </div>

                <Link
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
                  href="/register"
                >
                  Create a business account
                </Link>

                <p className="mt-8 text-center text-xs leading-5 text-slate-500 dark:text-slate-500">
                  By continuing, you agree to the JCS
                  Business Suite terms and privacy policy.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </GuestRoute>
  );
}
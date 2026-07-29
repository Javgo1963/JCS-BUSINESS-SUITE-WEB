"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";

import { GuestRoute } from "@/components/auth/GuestRoute";
import { useAuth } from "@/core/hooks/useAuth";

// MARK: - Forgot Password Page

export default function ForgotPasswordPage() {
  const {
    resetPassword,
    error,
    clearError,
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isEmailSent, setIsEmailSent] =
    useState(false);

  // MARK: - Submit

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    const normalizedEmail =
      email.trim().toLowerCase();

    if (!normalizedEmail) {
      return;
    }

    clearError();
    setIsSubmitting(true);
    setIsEmailSent(false);

    try {
      await resetPassword({
        email: normalizedEmail,
      });

      setIsEmailSent(true);
    } catch {
      // AuthProvider already converts and stores
      // the Firebase authentication error.
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
            {/* MARK: - Brand Panel */}

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
                  Recover secure access to your business.
                </h1>

                <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
                  Enter the email connected to your JCS
                  Business Suite account. We will send you
                  instructions to create a new password.
                </p>
              </div>

              <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                <p className="font-semibold">
                  Your business information remains protected
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Resetting your password does not modify your
                  business, employees, customers, inventory,
                  permissions, or account data.
                </p>
              </div>
            </div>

            {/* MARK: - Recovery Form */}

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
                    Reset your password
                  </h2>

                  <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                    Enter your account email to receive a
                    secure password reset link.
                  </p>
                </div>

                {isEmailSent ? (
                  <div className="space-y-6">
                    <div
                      aria-live="polite"
                      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                      role="status"
                    >
                      <p className="font-semibold">
                        Check your email
                      </p>

                      <p className="mt-2 text-sm leading-6">
                        Password reset instructions were sent
                        to:
                      </p>

                      <p className="mt-2 break-all text-sm font-semibold">
                        {email.trim().toLowerCase()}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Check your inbox and spam folder. The
                      email may take a few moments to arrive.
                    </p>

                    <button
                      className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
                      onClick={() => {
                        setIsEmailSent(false);
                        clearError();
                      }}
                      type="button"
                    >
                      Send to another email
                    </button>

                    <Link
                      className="flex h-12 w-full items-center justify-center rounded-xl bg-slate-950 px-5 font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-950/20 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                      href="/login"
                    >
                      Return to sign in
                    </Link>
                  </div>
                ) : (
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
                        !email.trim()
                      }
                      type="submit"
                    >
                      {isSubmitting
                        ? "Sending reset link..."
                        : "Send reset link"}
                    </button>

                    <Link
                      className="flex h-12 w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-500/15 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-white/5"
                      href="/login"
                    >
                      Back to sign in
                    </Link>
                  </form>
                )}

                <p className="mt-8 text-center text-xs leading-5 text-slate-500">
                  For security, JCS Business Suite will not
                  display whether an email belongs to a
                  particular business account.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </GuestRoute>
  );
}
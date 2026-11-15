
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import axios from "axios";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Factory,
  Boxes,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import { getDashboardPath } from "@/lib/auth/role-routes";
import { useAuth } from "@/providers/auth-provider";
import { useLogin } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const { status, user } = useAuth();
  const loginMutation = useLogin();

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (status === "authenticated" && user?.role?.code) {
      router.replace(getDashboardPath(user.role.code));
    }
  }, [status, user, router]);

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync(values);
      toast.success("Login successful");
    } catch (error) {
      let message = "Login failed. Please try again.";

      if (axios.isAxiosError(error)) {
        message =
          error.response?.data?.message ||
          "Unable to login. Check your email and password.";
      }

      toast.error(message);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F5F8F3]">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#E4F0E2] text-[#357A45]">
            <Factory className="size-6" />
          </div>
          <p className="text-sm font-medium text-[#647568]">
            {status === "loading"
              ? "Checking session..."
              : "Redirecting..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F8F3] p-3 sm:p-5 lg:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] w-full max-w-7xl overflow-hidden rounded-3xl border border-[#E3EAE0] bg-white shadow-[0_20px_70px_rgba(31,75,43,0.08)] sm:min-h-[calc(100vh-40px)] lg:grid-cols-2">

        {/* Left Branding Section */}
        <section className="relative hidden overflow-hidden bg-[#174B32] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-14 xl:py-14">

          {/* Background Decoration */}
          <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-16 -top-16 size-[290px] rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 size-[420px] rounded-full bg-[#286B45]/40 blur-3xl" />

          {/* Brand */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-white text-[#174B32] shadow-lg">
              <Factory className="size-6" />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Garments ERP
              </h1>
              <p className="text-xs tracking-wide text-green-100/70">
                FACTORY MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 my-12 max-w-lg">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-green-50">
              <span className="size-2 rounded-full bg-[#A8D5A0]" />
              Smart Manufacturing Management
            </div>

            <h2 className="text-4xl font-bold leading-[1.2] tracking-tight xl:text-5xl">
              Manage Your
              <span className="block text-[#A8D5A0]">
                Factory Smarter.
              </span>
            </h2>

            <p className="mt-6 max-w-md text-sm leading-7 text-green-50/75">
              A centralized platform to manage your factory operations,
              inventory, production, workforce and business performance
              with confidence.
            </p>

            {/* Feature Cards */}
            <div className="mt-10 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <Boxes className="mb-3 size-6 text-[#A8D5A0]" />
                <h3 className="text-sm font-semibold">
                  Inventory Control
                </h3>
                <p className="mt-1 text-xs leading-5 text-green-50/60">
                  Track materials and stock efficiently.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
                <ShieldCheck className="mb-3 size-6 text-[#A8D5A0]" />
                <h3 className="text-sm font-semibold">
                  Secure Operations
                </h3>
                <p className="mt-1 text-xs leading-5 text-green-50/60">
                  Role-based access and controlled workflows.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-green-50/55">
            <span>Manufacturing made organized.</span>
            <span>Built for efficiency.</span>
          </div>
        </section>

        {/* Right Login Section */}
        <section className="flex items-center justify-center px-6 py-12 sm:px-12 lg:px-14 xl:px-20">

          <div className="w-full max-w-md">

            {/* Mobile Brand */}
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#174B32] text-white">
                <Factory className="size-6" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-[#174B32]">
                  Garments ERP
                </h1>
                <p className="text-[10px] font-medium tracking-wider text-[#829183]">
                  FACTORY MANAGEMENT SYSTEM
                </p>
              </div>
            </div>

            {/* Form Heading */}
            <div className="mb-9">
              <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-[#EAF3E8] text-[#357A45]">
                <LockKeyhole className="size-7" />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#193B28]">
                Welcome back
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#788579]">
                Sign in to access your factory management workspace.
              </p>
            </div>

            {/* Login Form */}
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-[#344B39]"
                >
                  Email address
                </label>

                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#91A493]" />

                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    className="h-12 rounded-xl border-[#DDE7DB] bg-[#FAFCF9] pl-11 text-sm text-[#263C2B] shadow-none transition-all placeholder:text-[#A5B2A5] focus-visible:border-[#4D925D] focus-visible:ring-[#4D925D]/20"
                    {...register("email")}
                  />
                </div>

                {errors.email && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-[#344B39]"
                >
                  Password
                </label>

                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#91A493]" />

                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="h-12 rounded-xl border-[#DDE7DB] bg-[#FAFCF9] pl-11 pr-12 text-sm text-[#263C2B] shadow-none transition-all placeholder:text-[#A5B2A5] focus-visible:border-[#4D925D] focus-visible:ring-[#4D925D]/20"
                    {...register("password")}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#91A493] transition-colors hover:text-[#357A45]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-[18px]" />
                    ) : (
                      <Eye className="size-[18px]" />
                    )}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Sign In Button */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="group h-12 w-full rounded-xl bg-[#286B45] text-sm font-semibold text-white shadow-[0_5px_15px_rgba(40,107,69,0.18)] transition-all hover:bg-[#205A39] hover:shadow-[0_7px_20px_rgba(40,107,69,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loginMutation.isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign in to your account
                    <ArrowUpRight className="ml-2 size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Security Note */}
            <div className="mt-9 rounded-xl border border-[#E3EDE0] bg-[#F6FAF4] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#4B8B56]" />

                <div>
                  <p className="text-xs font-semibold text-[#355B3C]">
                    Secure Access
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#819182]">
                    Authorized personnel only. Contact your administrator
                    if you need access to the system.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-[#A0ACA0]">
              © {new Date().getFullYear()} Garments ERP. All rights reserved.
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}

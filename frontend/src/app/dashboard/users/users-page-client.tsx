"use client";

import { useEffect, useState, type SubmitEvent } from "react";
import {
  Search,
  Users,
  UserCheck,
  ShieldCheck,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { useCreateUser, useUsers } from "@/hooks/use-users";
import type {
  CreateUserPayload,
  UserRoleCode,
  UserStatus,
} from "@/types/user";

const ROLE_CREATION_RULES: Record<
  string,
  Exclude<UserRoleCode, "OWNER">[]
> = {
  OWNER: ["ADMIN", "ACCOUNTANT"],
  ADMIN: ["MANAGER", "ACCOUNTANT", "STOREKEEPER"],
  MANAGER: ["EMPLOYEE", "STOREKEEPER"],
};

const ROLE_LABELS: Record<UserRoleCode, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  ACCOUNTANT: "Accountant",
  STOREKEEPER: "Storekeeper",
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  DISABLED: "bg-gray-100 text-gray-700",
  LOCKED: "bg-red-100 text-red-700",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#6B9B70] focus:ring-2 focus:ring-[#6B9B70]/15";

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#6B9B70] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#56845c] disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(date: string | null) {
  if (!date) return "Never";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export default function UsersPage() {
  const { user } = useAuth();

  const currentRole = user?.role?.code ?? "";

  const allowedRoles = ROLE_CREATION_RULES[currentRole] ?? [];
  const canCreateUser = allowedRoles.length > 0;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRoleCode | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [page, setPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState<CreateUserPayload>({
    email: "",
    password: "",
    roleCode: allowedRoles[0] ?? "EMPLOYEE",
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    roleCode: roleFilter || undefined,
    status: statusFilter || undefined,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isFetching,
    refetch,
  } = useUsers(queryParams);

  const createUserMutation = useCreateUser();

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const totalUsers = pagination?.total ?? 0;

  // The current page contains only a subset of users.
  // Therefore, these cards should not pretend to be global counts.
  const activeUsersOnPage = users.filter(
    (item) => item.status === "ACTIVE",
  ).length;

  const rolesOnPage = new Set(users.map((item) => item.role.code)).size;

  function handleFilterChange(
    type: "role" | "status",
    value: string,
  ) {
    setPage(1);

    if (type === "role") {
      setRoleFilter(value as UserRoleCode | "");
    } else {
      setStatusFilter(value as UserStatus | "");
    }
  }

  function handleCreateUser(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowedRoles.includes(form.roleCode)) {
      toast.error("You are not allowed to create this role.");
      return;
    }

    const payload: CreateUserPayload = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      roleCode: form.roleCode,
    };

    createUserMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("User account created successfully.");

        setForm({
          email: "",
          password: "",
          roleCode: allowedRoles[0] ?? "EMPLOYEE",
        });

        setShowCreateForm(false);
      },
      onError: (error: any) => {
        const message =
          error?.response?.data?.message ||
          "Failed to create user account.";

        toast.error(message);
      },
    });
  }

  function handleCloseForm() {
    if (createUserMutation.isPending) return;

    setShowCreateForm(false);
    setForm({
      email: "",
      password: "",
      roleCode: allowedRoles[0] ?? "EMPLOYEE",
    });
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts and monitor account information.
          </p>
        </div>

        {canCreateUser && (
          <button
            type="button"
            onClick={() => setShowCreateForm((previous) => !previous)}
            className={buttonClass}
          >
            {showCreateForm ? (
              <X size={17} />
            ) : (
              <Plus size={17} />
            )}

            {showCreateForm ? "Close Form" : "Create User"}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {pagination?.total ?? "—"}
              </h2>
            </div>

            <div className="rounded-lg bg-[#E8F0DF] p-3 text-[#56845c]">
              <Users size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Active Users on This Page
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {isLoading ? "—" : activeUsersOnPage}
              </h2>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <UserCheck size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Roles on This Page
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {isLoading ? "—" : rolesOnPage}
              </h2>
            </div>

            <div className="rounded-lg bg-[#E8F0DF] p-3 text-[#56845c]">
              <ShieldCheck size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Create User Form */}
      {showCreateForm && canCreateUser && (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Create New User
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Create an account and assign an authorized role.
            </p>
          </div>

          <form
            onSubmit={handleCreateUser}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div>
              <label
                htmlFor="user-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="user-email"
                type="email"
                required
                autoComplete="email"
                placeholder="user@example.com"
                className={inputClass}
                value={form.email}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="user-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <input
                id="user-password"
                type="password"
                required
                minLength={12}
                maxLength={72}
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
                className={inputClass}
                value={form.password}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    password: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label
                htmlFor="user-role"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Assign Role
              </label>

              <select
                id="user-role"
                required
                className={inputClass}
                value={form.roleCode}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    roleCode: event.target.value as CreateUserPayload["roleCode"],
                  }))
                }
              >
                {allowedRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseForm}
                disabled={createUserMutation.isPending}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={createUserMutation.isPending}
                className={buttonClass}
              >
                {createUserMutation.isPending
                  ? "Creating..."
                  : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">
              Created User Accounts
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Browse and search all registered accounts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={isFetching ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 gap-3 border-b border-gray-100 p-5 md:grid-cols-3">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              placeholder="Search by email..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={`${inputClass} pl-9`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) =>
              handleFilterChange("role", event.target.value)
            }
            className={inputClass}
          >
            <option value="">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([code, label]) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              handleFilterChange("status", event.target.value)
            }
            className={inputClass}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-8 text-center">
            <p className="font-medium text-red-600">
              Failed to load users.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {(error as Error)?.message || "Please try again."}
            </p>

            <button
              type="button"
              onClick={() => refetch()}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading State */}
        {!isError && isLoading && (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-lg bg-gray-100"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && users.length === 0 && (
          <div className="p-10 text-center">
            <Users
              size={36}
              className="mx-auto text-gray-300"
            />

            <h3 className="mt-3 font-medium text-gray-800">
              No users found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              No accounts match your current search or filters.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && users.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#F7F8F3]">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Role</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Created At</th>
                    <th className="px-5 py-4">Last Login</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {users.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0DF] text-sm font-semibold text-[#56845c]">
                            {item.email.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.email}
                            </p>

                            <p className="mt-0.5 text-xs text-gray-400">
                              ID: {item.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-[#E8F0DF] px-3 py-1 text-xs font-medium text-[#56845c]">
                          {ROLE_LABELS[item.role.code] ??
                            item.role.name}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            STATUS_STYLES[item.status] ??
                            "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-sm text-gray-600">
                        {formatDate(item.lastLoginAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-medium text-gray-800">
                  {totalUsers === 0
                    ? 0
                    : (page - 1) * 10 + 1}
                </span>
                {" - "}
                <span className="font-medium text-gray-800">
                  {Math.min(page * 10, totalUsers)}
                </span>
                {" of "}
                <span className="font-medium text-gray-800">
                  {totalUsers}
                </span>
                {" users"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((previous) => previous - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <span className="px-2 text-sm text-gray-600">
                  {page} / {pagination?.totalPages ?? 1}
                </span>

                <button
                  type="button"
                  disabled={
                    page >= (pagination?.totalPages ?? 1) ||
                    isFetching
                  }
                  onClick={() => setPage((previous) => previous + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
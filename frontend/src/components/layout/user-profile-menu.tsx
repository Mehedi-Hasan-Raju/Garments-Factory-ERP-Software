
"use client";

import { useRouter } from "next/navigation";
import { LogOut, UserRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/providers/auth-provider";
import { useLogout } from "@/hooks/use-auth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function UserProfileMenu() {
  const router = useRouter();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  if (!user) return null;

  const email = user.email;
  const role = user.role.code;

  const initials = email
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();

      toast.success("Logged out successfully");

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-auto items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        disabled={logoutMutation.isPending}
      >
        <Avatar className="size-9">
          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden sm:block">
          <p className="max-w-40 truncate text-sm font-medium">
            {email}
          </p>
          <p className="text-xs text-muted-foreground">
            {role}
          </p>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium">
                Account
              </span>

              <span className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <UserRound className="mr-2 size-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem disabled>
            <ShieldCheck className="mr-2 size-4" />
            <span>{role} Account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem
            disabled={logoutMutation.isPending}
            onClick={() => void handleLogout()}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 size-4" />

            <span>
              {logoutMutation.isPending
                ? "Signing out..."
                : "Logout"}
            </span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

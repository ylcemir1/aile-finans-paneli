import { logout } from "@/actions/auth";
import type { Profile } from "@/types";

interface NavbarProps {
  profile: Pick<Profile, "full_name" | "role">;
}

export function Navbar({ profile }: NavbarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-background-light sticky top-0 z-10 md:hidden">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
          <span className="material-symbols-outlined text-primary">
            family_restroom
          </span>
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">
            Tekrar hoş geldin,
          </p>
          <h1 className="text-lg font-bold leading-none text-slate-900">
            {profile.full_name}
          </h1>
        </div>
      </div>
      <div className="flex gap-2">
        <form action={logout}>
          <button
            type="submit"
            className="size-10 rounded-full flex items-center justify-center bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600">
              logout
            </span>
          </button>
        </form>
      </div>
    </header>
  );
}

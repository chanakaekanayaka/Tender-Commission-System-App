import { User } from "lucide-react";
import Link from "next/link";

interface ProfileButtonProps {
  href: string;
  initials?: string;
}

/** Fixed floating profile entry point, top-right of the viewport — a plain Link (no client state
 *  needed) to the portal's Profile page. Sits above page content but below the mobile nav drawer's
 *  overlay (z-40/z-50 in DashboardLayout) so it doesn't fight the drawer when it's open. Pinned
 *  lower on mobile (`top-16`) to clear DashboardLayout's own `md:hidden` mobile header bar; once
 *  that header disappears at the `md` breakpoint it moves up to `top-6`. */
export function ProfileButton({ href, initials }: ProfileButtonProps) {
  return (
    <Link
      href={href}
      aria-label="Profile"
      className="fixed top-16 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-ink shadow-lg hover:bg-surface md:top-6 md:right-6"
    >
      {initials || <User className="h-5 w-5" aria-hidden />}
    </Link>
  );
}

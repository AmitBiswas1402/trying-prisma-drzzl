import { Link2 } from "lucide-react";
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/users.action";

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser();

  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center text-2xl font-bold text-primary font-mono tracking-wider"
            >
              S
              <span className="inline-block align-middle mr-1">
                <Link2 />
              </span>
              CIALLY
            </Link>
          </div>

          <DesktopNavbar />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;

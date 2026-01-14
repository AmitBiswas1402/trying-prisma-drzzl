import { Link2 } from "lucide-react";
import Link from "next/link";
import DesktopNavbar from "./DesktopNavbar";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/actions/users.action";
import Image from "next/image";

async function Navbar() {
  const user = await currentUser();
  if (user) await syncUser();

  return (
    <nav className="sticky top-0 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="Logo" width={36} height={36} className="mr-2" />
            <Link
              href="/"
              className="flex items-center text-2xl font-bold text-primary font-mono tracking-wider"
            >
              Socially
            </Link>
          </div>

          <DesktopNavbar />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;

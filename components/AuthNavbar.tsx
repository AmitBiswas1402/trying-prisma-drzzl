"use client"

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

const AuthNavbar = () => {
  const { isSignedIn } = useAuth();

  return (
    <div>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      )}
    </div>
  );
};

export default AuthNavbar;

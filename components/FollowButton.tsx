"use client";

import { toggleFollow } from "@/actions/users.action";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Loader2Icon } from "lucide-react";

const FollowButton = ({ userId }: { userId: string }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);

    try {
      await toggleFollow(userId);
      toast.success("User followed successfully");
    } catch (error) {
      toast.error("Error following user");
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        size={"sm"}
        variant={"secondary"}
        onClick={handleFollow}
        disabled={isLoading}
        className="w-20"
      >
        {isLoading ? <Loader2Icon className="size-4 animate-spin" /> : "Follow"}
      </Button>
    </div>
  );
};
export default FollowButton;

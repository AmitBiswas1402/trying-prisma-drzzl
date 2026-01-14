"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { ImageIcon, Loader2Icon, SendIcon } from "lucide-react";
import { createPost } from "@/actions/post.action";
import { toast } from "sonner";
import ImageUpload from "./ImageUpload";

const CreatePost = () => {
  const { user } = useUser();
  const [content, setContent] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() && !imageURL) return;

    setIsPosting(true);
    try {
      const result = await createPost(content, imageURL);

      if (result?.success) {
        setContent("");
        setImageURL("");
        setShowImageUpload(false);
        toast("Message Posted");
      }
    } catch (error) {
      console.log("Error in createPost", error);
      toast.error("Error creating post");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-6 shadow-[0_6px_20px_rgba(0,0,0,0.08)] rounded-2xl">
      <CardContent className="pt-6">
        <div className="space-y-5">
          {/* INPUT ROW */}
          <div className="flex gap-4">
            <Avatar className="w-10 h-10 border border-gray-200 shadow-sm">
              <AvatarImage src={user?.imageUrl || "/avatar.png"} />
            </Avatar>

            <Textarea
              placeholder="Write something..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPosting}
              className="
              flex-1
              resize-none
              rounded-xl
              bg-zinc-800
              border-0 border-zinc-700
              p-4
              text-white placeholder-zinc-400
              caret-white
              outline-none
              focus-visible:ring-2 focus-visible:ring-blue-500
              transition
            "
            />
          </div>

          {/* IMAGE UPLOAD */}
          {(showImageUpload || imageURL) && (
            <div className="border border-gray-800 rounded-xl p-4 bg-black shadow-sm">
              <ImageUpload
                endpoint="postImage"
                value={imageURL}
                onChange={(url) => {
                  setImageURL(url);
                  if (!url) setShowImageUpload(false);
                }}
              />
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-4">
            {/* LEFT ACTIONS */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-100 hover:text-blue-600 transition"
              onClick={() => setShowImageUpload((p) => !p)}
            >
              <ImageIcon className="size-4 mr-2" />
              Photo
            </Button>

            {/* SUBMIT */}
            <Button
              onClick={handleSubmit}
              disabled={(!content.trim() && !imageURL) || isPosting}
              className="
                px-5 py-2.5 rounded-xl
                bg-black text-white text-sm font-semibold
                transition-all duration-300 ease-out
                hover:bg-blue-600 hover:scale-[1.03]
                active:scale-[0.98]
              "
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <SendIcon className="size-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default CreatePost;

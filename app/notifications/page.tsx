"use client";

import {
  getNotifications,
  markNotificationsAsRead,
} from "@/actions/notification.action";
import { NotificationsSkeleton } from "@/components/NotificationsSkeleton";
import { AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@radix-ui/react-avatar";
import { formatDistanceToNow } from "date-fns";
import { HeartIcon, MessageCircleIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Notifications = Awaited<ReturnType<typeof getNotifications>>;
type Notification = Notifications[number];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "LIKE":
      return <HeartIcon className="size-4 text-red-500" />;
    case "COMMENT":
      return <MessageCircleIcon className="size-4 text-blue-500" />;
    case "FOLLOW":
      return <UserPlusIcon className="size-4 text-green-500" />;
    default:
      return null;
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data);

        const unreadIds = data.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length > 0) await markNotificationsAsRead(unreadIds);
      } catch (error) {
        toast.error("Failed to fetch notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  if (isLoading) {
    <NotificationsSkeleton />;
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-card">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Notifications</CardTitle>
            <span className="text-sm text-muted-foreground">
              {notifications.filter((n) => !n.read).length} unread
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100vh-12rem)]">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                  group flex gap-4 px-5 py-4 border-b
                  transition-colors
                  hover:bg-muted/40
                  ${!notification.read ? "bg-muted/30" : ""}
                `}
                >
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 mt-1 shrink-0">
                    <AvatarImage
                      src={notification.creator?.image ?? "/avatar.png"}
                    />
                  </Avatar>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    {/* Title */}
                    <div className="flex items-center gap-2 text-sm">
                      {getNotificationIcon(notification.type)}
                      <span>
                        <span className="font-medium text-foreground">
                          {notification.creator?.name ??
                            notification.creator?.username ??
                            "Unknown"}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {notification.type === "FOLLOW"
                            ? "started following you"
                            : notification.type === "LIKE"
                            ? "liked your post"
                            : "commented on your post"}
                        </span>
                      </span>
                    </div>

                    {/* Post preview */}
                    {notification.post &&
                      (notification.type === "LIKE" ||
                        notification.type === "COMMENT") && (
                        <div className="ml-6 mt-2 space-y-2">
                          <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                            <p className="line-clamp-3">
                              {notification.post.content}
                            </p>

                            {notification.post.image && (
                              <img
                                src={notification.post.image}
                                alt="Post content"
                                className="mt-3 rounded-md max-h-40 w-full object-cover"
                              />
                            )}
                          </div>

                          {/* Comment preview */}
                          {notification.type === "COMMENT" &&
                            notification.comment && (
                              <div className="rounded-lg bg-accent/40 p-3 text-sm">
                                {notification.comment.content}
                              </div>
                            )}
                        </div>
                      )}

                    {/* Timestamp */}
                    <p className="ml-6 text-xs text-muted-foreground">
                      {formatDistanceToNow(
                        new Date(notification.createdAt ?? new Date()),
                        { addSuffix: true }
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;

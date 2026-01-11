"use server";

import { db } from "@/db";
import { notifications, users, posts, comments } from "@/db/schema";
import { eq, inArray, desc } from "drizzle-orm";
import { getDbUserId } from "./users.action";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function getNotifications() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const result = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        read: notifications.read,
        createdAt: notifications.createdAt,

        creator: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },

        post: {
          id: posts.id,
          content: posts.content,
          image: posts.image,
        },

        comment: {
          id: comments.id,
          content: comments.content,
          createdAt: comments.createdAt,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.creatorId))
      .leftJoin(posts, eq(posts.id, notifications.postId))
      .leftJoin(comments, eq(comments.id, notifications.commentId))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));

    return result;
  } catch (error: unknown) {
    console.error("Error fetching notifications:", toErrorMessage(error));
    throw new Error("Failed to fetch notifications");
  }
}

export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    if (!notificationIds.length) return { success: true };

    await db
      .update(notifications)
      .set({ read: true })
      .where(inArray(notifications.id, notificationIds));

    return { success: true };
  } catch (error: unknown) {
    console.error(
      "Error marking notifications as read:",
      toErrorMessage(error)
    );
    return { success: false };
  }
}

"use server";

import { db } from "@/db";
import { users, posts, comments, likes, follows } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { getDbUserId } from "./users.action";

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function getProfileByUsername(username: string) {
  try {
    const [userData] = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        bio: users.bio,
        image: users.image,
        location: users.location,
        website: users.website,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!userData) return null;

    // Get counts separately using subqueries
    const [followersResult] = await db
      .select({
        count: sql<number>`count(distinct ${follows.followerId})`,
      })
      .from(follows)
      .where(eq(follows.followingId, userData.id));

    const [followingResult] = await db
      .select({
        count: sql<number>`count(distinct ${follows.followingId})`,
      })
      .from(follows)
      .where(eq(follows.followerId, userData.id));

    const [postsResult] = await db
      .select({
        count: sql<number>`count(distinct ${posts.id})`,
      })
      .from(posts)
      .where(eq(posts.authorId, userData.id));

    return {
      ...userData,
      followersCount: Number(followersResult?.count ?? 0),
      followingCount: Number(followingResult?.count ?? 0),
      postsCount: Number(postsResult?.count ?? 0),
    };
  } catch (error: unknown) {
    console.error("Error fetching profile:", toErrorMessage(error));
    throw new Error("Failed to fetch profile");
  }
}

export async function getUserPosts(userId: string) {
  try {
    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
        likesCount: sql<number>`count(distinct ${likes.userId})`,
        commentsCount: sql<number>`count(distinct ${comments.id})`,
      })
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(likes, eq(likes.postId, posts.id))
      .leftJoin(comments, eq(comments.postId, posts.id))
      .where(eq(posts.authorId, userId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt));

    return result;
  } catch (error: unknown) {
    console.error("Error fetching user posts:", toErrorMessage(error));
    throw new Error("Failed to fetch user posts");
  }
}

export async function getUserLikedPosts(userId: string) {
  try {
    const result = await db
      .select({
        post: posts,
        author: {
          id: users.id,
          name: users.name,
          username: users.username,
          image: users.image,
        },
        likesCount: sql<number>`count(distinct ${likes.userId})`,
        commentsCount: sql<number>`count(distinct ${comments.id})`,
      })
      .from(likes)
      .innerJoin(posts, eq(posts.id, likes.postId))
      .innerJoin(users, eq(users.id, posts.authorId))
      .leftJoin(comments, eq(comments.postId, posts.id))
      .where(eq(likes.userId, userId))
      .groupBy(posts.id, users.id)
      .orderBy(desc(posts.createdAt));

    return result;
  } catch (error: unknown) {
    console.error("Error fetching liked posts:", toErrorMessage(error));
    throw new Error("Failed to fetch liked posts");
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) throw new Error("Unauthorized");

    const name = formData.get("name") as string | null;
    const bio = formData.get("bio") as string | null;
    const location = formData.get("location") as string | null;
    const website = formData.get("website") as string | null;

    const [user] = await db
      .update(users)
      .set({
        name,
        bio,
        location,
        website,
      })
      .where(eq(users.clerkId, clerkId))
      .returning();

    revalidatePath("/profile");
    return { success: true, user };
  } catch (error: unknown) {
    console.error("Error updating profile:", toErrorMessage(error));
    return { success: false, error: "Failed to update profile" };
  }
}

export async function isFollowing(userId: string) {
  try {
    const currentUserId = await getDbUserId();
    if (!currentUserId) return false;

    const follow = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, currentUserId),
          eq(follows.followingId, userId)
        )
      )
      .limit(1);

    return follow.length > 0;
  } catch (error: unknown) {
    console.error("Error checking follow status:", toErrorMessage(error));
    return false;
  }
}

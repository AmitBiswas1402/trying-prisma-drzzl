"use server";

import { db } from "@/db";
import { users, follows, notifications } from "@/db/schema";
import { eq, and, not, sql } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function syncUser() {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !user) return;

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, userId))
    .limit(1);

  if (existing.length) return existing[0];

  const [created] = await db
    .insert(users)
    .values({
      clerkId: userId,
      email: user.emailAddresses[0].emailAddress,
      username:
        user.username ??
        user.emailAddresses[0].emailAddress.split("@")[0],
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`,
      image: user.imageUrl,
    })
    .returning();

  return created;
}

export async function getUserByClerkId(clerkId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      image: users.image,
      clerkId: users.clerkId,
      followersCount: sql<number>`count(distinct ${follows.followerId})`,
      followingCount: sql<number>`count(distinct ${follows.followingId})`,
      postsCount: sql<number>`count(distinct posts.id)`,
    })
    .from(users)
    .leftJoin(follows, eq(follows.followingId, users.id))
    .leftJoin(sql`posts`, sql`posts.author_id = users.id`)
    .where(eq(users.clerkId, clerkId))
    .groupBy(users.id);

  return user ?? null;
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();
    if (!userId) return [];

    const randomUsers = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        image: users.image,
        followersCount: sql<number>`count(${follows.followerId})`,
      })
      .from(users)
      .leftJoin(
        follows,
        eq(follows.followingId, users.id)
      )
      .where(
        and(
          not(eq(users.id, userId)),
          not(
            sql`${users.id} IN (
              SELECT following_id FROM follows WHERE follower_id = ${userId}
            )`
          )
        )
      )
      .groupBy(users.id)
      .orderBy(sql`random()`)
      .limit(3);

    return randomUsers;
  } catch (error) {
    console.log("Error fetching random users", error);
    return [];
  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    if (userId === targetUserId) {
      throw new Error("You cannot follow yourself");
    }

    const existing = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, userId),
          eq(follows.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existing.length) {
      // UNFOLLOW
      await db
        .delete(follows)
        .where(
          and(
            eq(follows.followerId, userId),
            eq(follows.followingId, targetUserId)
          )
        );
    } else {
      // FOLLOW + NOTIFICATION (transaction)
      await db.transaction(async (tx) => {
        await tx.insert(follows).values({
          followerId: userId,
          followingId: targetUserId,
        });

        await tx.insert(notifications).values({
          type: "FOLLOW",
          userId: targetUserId,
          creatorId: userId,
        });
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.log("Error in toggleFollow", error);
    return { success: false, error: "Error toggling follow" };
  }
}

"use server";

import { db } from "@/db";
import { users, posts, likes, comments, notifications } from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDbUserId } from "./users.action";

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const [post] = await db
      .insert(posts)
      .values({ content, image, authorId: userId })
      .returning();

    revalidatePath("/");
    return { success: true, post };
  } catch (error) {
    console.log("Error in createPost", error);
    return { success: false, error: "Error creating post" };
  }
}

export async function getPosts() {
  try {
    const result = await db
      .select()
      .from(posts)
      .innerJoin(users, eq(users.id, posts.authorId))
      .orderBy(desc(posts.createdAt));

    if (result.length === 0) {
      return [];
    }

    // Fetch comments and likes for all posts
    const postIds = result.map((item) => item.posts.id);
    
    // Fetch all comments with their authors
    const allCommentsData = await db
      .select()
      .from(comments)
      .innerJoin(users, eq(users.id, comments.authorId))
      .where(inArray(comments.postId, postIds));

    // Fetch all likes
    const allLikesData = await db
      .select({
        userId: likes.userId,
        postId: likes.postId,
      })
      .from(likes)
      .where(inArray(likes.postId, postIds));

    // Transform data to match PostCard expectations
    const transformedPosts = result.map((item) => {
      const postComments = allCommentsData
        .filter((c) => c.comments.postId === item.posts.id)
        .map((c) => ({
          id: c.comments.id,
          content: c.comments.content,
          userId: c.comments.authorId,
          createdAt: c.comments.createdAt ?? new Date(),
          author: {
            id: c.users.id,
            username: c.users.username,
            name: c.users.name,
            image: c.users.image,
          },
        }));

      const postLikes = allLikesData
        .filter((l) => l.postId === item.posts.id)
        .map((l) => ({ userId: l.userId }));

      return {
        id: item.posts.id,
        content: item.posts.content ?? "",
        image: item.posts.image,
        createdAt: item.posts.createdAt ?? new Date(),
        author: {
          id: item.users.id,
          username: item.users.username,
          image: item.users.image,
        },
        comments: postComments,
        likes: postLikes,
        _count: {
          likes: postLikes.length,
        },
      };
    });

    return transformedPosts;
  } catch (error) {
    console.log("Error in getPosts", error);
    throw new Error("Failed to fetch posts");
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    // check existing like
    const existing = await db
      .select()
      .from(likes)
      .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
      .limit(1);

    if (existing.length) {
      // Unlike
      await db
        .delete(likes)
        .where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    } else {
      // Like + Notification in a transaction
      await db.transaction(async (tx) => {
        await tx.insert(likes).values({ postId, userId });

        // Notify only if not your own post
        const [p] = await tx
          .select({ authorId: posts.authorId })
          .from(posts)
          .where(eq(posts.id, postId))
          .limit(1);

        if (p && p.authorId !== userId) {
          await tx.insert(notifications).values({
            type: "LIKE",
            userId: p.authorId,
            creatorId: userId,
            postId,
          });
        }
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete post:", message);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function createComment(postId: string, content: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return { success: false, error: "Unauthorized" };

    const [comment] = await db
      .insert(comments)
      .values({
        content,
        postId,
        authorId: userId,
      })
      .returning();

    // notification if not your own post
    const [p] = await db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (p && p.authorId !== userId) {
      await db.insert(notifications).values({
        type: "COMMENT",
        userId: p.authorId,
        creatorId: userId,
        postId,
        commentId: comment.id,
      });
    }

    revalidatePath("/");
    return { success: true, comment };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete post:", message);
    return { success: false, error: "Failed to delete post" };
  }
}

export async function deletePost(postId: string) {
  try {
    const userId = await getDbUserId();

    const [post] = await db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) return { success: false, error: "Post not found" };

    if (post.authorId !== userId)
      return { success: false, error: "Unauthorized - no delete permission" };

    await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.authorId, userId)));

    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete post:", message);
    return { success: false, error: "Failed to delete post" };
  }
}

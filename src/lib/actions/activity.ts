'use server';

import prisma from "@/lib/client";
import { auth } from "@clerk/nextjs/server";

export type ActivityType = 'POST_CREATED' | 'POST_LIKED' | 'COMMENT_ADDED' | 'COMMENT_LIKED';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  createdAt: Date;
  postId?: number;
  postTitle?: string;
  postDesc?: string; 
  commentId?: number;
  commentDesc?: string;
  targetUser?: {
    id: string;
    username: string;
    name: string | null;
    surname: string | null;
    avatar: string | null;
  };
};

export async function getUserActivity(page: number = 1, limit: number = 10): Promise<ActivityItem[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return [];
    }

    // Lấy các bài đăng được tạo bởi người dùng
    const posts = await prisma.post.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    // Lấy các bài đăng được thích bởi người dùng
    const likes = await prisma.like.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Lấy các bình luận được tạo bởi người dùng
    const comments = await prisma.comment.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Chuyển đổi bài đăng thành các mục hoạt động
    const postActivities: ActivityItem[] = posts.map(post => ({
      id: `post-${post.id}`,
      type: 'POST_CREATED',
      createdAt: post.createdAt,
      postId: post.id,
      postDesc: post.desc,
    }));

    // Chuyển đổi lượt thích thành các mục hoạt động
    const likeActivities: ActivityItem[] = likes
      .filter(like => like.post !== null) // Lọc bỏ các bài đăng null
      .map(like => ({
        id: `like-${like.id}`,
        type: 'POST_LIKED',
        createdAt: like.createdAt,
        postId: like.post?.id,
        postDesc: like.post?.desc || '',
        targetUser: like.post?.user,
      }));

    // Chuyển đổi bình luận thành các mục hoạt động
    const commentActivities: ActivityItem[] = comments
      .filter(comment => comment.post !== null) // Lọc bỏ các bài đăng null
      .map(comment => ({
        id: `comment-${comment.id}`,
        type: 'COMMENT_ADDED',
        createdAt: comment.createdAt,
        postId: comment.post?.id,
        commentId: comment.id,
        commentDesc: comment.desc,
        targetUser: comment.post?.user.id !== userId ? comment.post?.user : undefined,
      }));

    // Kết hợp tất cả các hoạt động và sắp xếp theo createdAt (mới nhất trước)
    const allActivities = [...postActivities, ...likeActivities, ...commentActivities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Áp dụng phân trang
    const startIndex = (page - 1) * limit;
    return allActivities.slice(startIndex, startIndex + limit);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    return [];
  }
}

export async function getActivityByDate(date: Date): Promise<ActivityItem[]> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return [];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Lấy hoạt động cho ngày được chỉ định sử dụng cùng cách tiếp cận như getUserActivity
    // nhưng với bộ lọc ngày tháng
    
    const posts = await prisma.post.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            surname: true,
            avatar: true,
          },
        },
      },
    });

    const likes = await prisma.like.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    const comments = await prisma.comment.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                surname: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Chuyển đổi và kết hợp dữ liệu
    const postActivities = posts.map(post => ({
      id: `post-${post.id}`,
      type: 'POST_CREATED' as ActivityType,
      createdAt: post.createdAt,
      postId: post.id,
      postDesc: post.desc,
    }));

    const likeActivities = likes
      .filter(like => like.post !== null)
      .map(like => ({
        id: `like-${like.id}`,
        type: 'POST_LIKED' as ActivityType,
        createdAt: like.createdAt,
        postId: like.post?.id,
        postDesc: like.post?.desc || '',
        targetUser: like.post?.user,
      }));

    const commentActivities = comments
      .filter(comment => comment.post !== null)
      .map(comment => ({
        id: `comment-${comment.id}`,
        type: 'COMMENT_ADDED' as ActivityType,
        createdAt: comment.createdAt,
        postId: comment.post?.id,
        commentId: comment.id,
        commentDesc: comment.desc,
        targetUser: comment.post?.user.id !== userId ? comment.post?.user : undefined,
      }));

    // Kết hợp tất cả các hoạt động và sắp xếp theo createdAt (mới nhất trước)
    return [...postActivities, ...likeActivities, ...commentActivities]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error("Error fetching user activity by date:", error);
    return [];
  }
} 
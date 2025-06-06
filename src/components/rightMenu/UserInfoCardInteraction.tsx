"use client";

import { switchBlock, switchFollow } from "@/lib/actions";
import { useOptimistic, useState } from "react";
import ReportUserButton from "../profile/ReportUserButton";

const UserInfoCardInteraction = ({
  userId,
  username,
  isUserBlocked,
  isFollowing,
  isFollowingSent,
}: {
  userId: string;
  username: string;
  isUserBlocked: boolean;
  isFollowing: boolean;
  isFollowingSent: boolean;
}) => {
  const [userState, setUserState] = useState({
    following: isFollowing,
    blocked: isUserBlocked,
    followingRequestSent: isFollowingSent,
  });

  const follow = async () => {
    switchOptimisticState("follow");
    try {
      await switchFollow(userId);
      setUserState((prev) => ({
        ...prev,
        following: prev.following && false,
        followingRequestSent:
          !prev.following && !prev.followingRequestSent ? true : false,
      }));
    } catch {
      // Xử lý lỗi gì đó phát sinh
    }
  };

  const block = async () => {
    switchOptimisticState("block");
    try {
      await switchBlock(userId);
      setUserState((prev) => ({
        ...prev,
        blocked: !prev.blocked,
      }));
    } catch {
      // Xử lý lỗi gì đó phát sinh
    }
  };

  const [optimisticState, switchOptimisticState] = useOptimistic(
    userState,
    (state, value: "follow" | "block") =>
      value === "follow"
        ? {
            ...state,
            following: state.following && false,
            followingRequestSent:
              !state.following && !state.followingRequestSent ? true : false,
          }
        : { ...state, blocked: !state.blocked }
  );
  return (
    <div className="flex flex-col gap-3 mt-2">
      <form action={follow}>
        <button className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-sm rounded-xl p-3 hover:bg-emerald-100 dark:hover:bg-emerald-800/20 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors font-medium shadow-sm hover:shadow-md">
          {optimisticState.following
            ? "Following"
            : optimisticState.followingRequestSent
            ? "Friend Request Sent"
            : "Follow"}
        </button>
      </form>
      
      <div className="flex items-center justify-between text-xs">
        <ReportUserButton userId={userId} username={username} />
        
        <form action={block}>
          <button className="text-red-400 cursor-pointer hover:underline hover:text-red-600 dark:hover:text-red-300 transition-colors">
            {optimisticState.blocked ? "Unblock User" : "Block User"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserInfoCardInteraction;
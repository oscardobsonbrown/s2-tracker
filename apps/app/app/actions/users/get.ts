"use server";

import { auth, clerkClient } from "@repo/auth/server";
import { logger } from "@repo/observability/logger.server";

export type UserInfo = {
  name: string;
  picture: string;
  color: string;
};

type ClerkUserSummary = {
  emailAddresses?: Array<{ emailAddress?: string | null }>;
  firstName?: string | null;
  id: string;
  imageUrl?: string;
  lastName?: string | null;
  username?: string | null;
};

const getName = (user: ClerkUserSummary): string | undefined => {
  let name = user.firstName ?? undefined;

  if (name && user.lastName) {
    name = `${name} ${user.lastName}`;
  } else if (!name) {
    name =
      user.username ?? user.emailAddresses?.at(0)?.emailAddress ?? undefined;
  }

  return name;
};

const colors = [
  "var(--color-red-500)",
  "var(--color-orange-500)",
  "var(--color-amber-500)",
  "var(--color-yellow-500)",
  "var(--color-lime-500)",
  "var(--color-green-500)",
  "var(--color-emerald-500)",
  "var(--color-teal-500)",
  "var(--color-cyan-500)",
  "var(--color-sky-500)",
  "var(--color-blue-500)",
  "var(--color-indigo-500)",
  "var(--color-violet-500)",
  "var(--color-purple-500)",
  "var(--color-fuchsia-500)",
  "var(--color-pink-500)",
  "var(--color-rose-500)",
];

const getUsersLogger = logger.child({
  app: "app",
  action: "getUsers",
});

export const getUsers = async (
  userIds: string[]
): Promise<
  | {
      data: UserInfo[];
    }
  | {
      error: unknown;
    }
> => {
  getUsersLogger.info(
    { requestedUserCount: userIds.length },
    "Get users action started"
  );

  try {
    const { userId } = await auth();

    if (!userId) {
      getUsersLogger.warn("Get users action rejected without a user");
      throw new Error("Not logged in");
    }

    const clerk = await clerkClient();

    const usersList = await clerk.users.getUserList({
      limit: 100,
    });

    const data: UserInfo[] = usersList.data
      .filter((user) => userIds.includes(user.id))
      .map((user) => ({
        name: getName(user) ?? "Unknown user",
        picture: user.imageUrl ?? "",
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

    getUsersLogger.info(
      {
        userCount: usersList.data.length,
        resultCount: data.length,
      },
      "Get users action completed"
    );

    return { data };
  } catch (error) {
    getUsersLogger.error({ err: error }, "Get users action failed");
    return { error };
  }
};

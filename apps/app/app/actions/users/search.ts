"use server";

import { auth, clerkClient } from "@repo/auth/server";
import { logger } from "@repo/observability/logger.server";
import Fuse from "fuse.js";

const userSearchLogger = logger.child({
  app: "app",
  action: "searchUsers",
});

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

export const searchUsers = async (
  query: string
): Promise<
  | {
      data: string[];
    }
  | {
      error: unknown;
    }
> => {
  userSearchLogger.info(
    { queryLength: query.length },
    "User search action started"
  );

  try {
    const { userId } = await auth();

    if (!userId) {
      userSearchLogger.warn("User search action rejected without a user");
      throw new Error("Not logged in");
    }

    const clerk = await clerkClient();

    const usersList = await clerk.users.getUserList({
      limit: 100,
    });

    const users = usersList.data.map((user) => ({
      id: user.id,
      name: getName(user),
      imageUrl: user.imageUrl,
    }));

    const fuse = new Fuse(users, {
      keys: ["name"],
      minMatchCharLength: 1,
      threshold: 0.3,
    });

    const results = fuse.search(query);
    const data = results.map((result) => result.item.id);

    userSearchLogger.info(
      {
        userCount: usersList.data.length,
        resultCount: data.length,
      },
      "User search action completed"
    );

    return { data };
  } catch (error) {
    userSearchLogger.error({ err: error }, "User search action failed");
    return { error };
  }
};

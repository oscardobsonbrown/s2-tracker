import { createHmac } from "node:crypto";
import { analytics } from "@repo/analytics/server";
import { clerkClient } from "@repo/auth/server";
import { parseError } from "@repo/observability/error";
import { logger } from "@repo/observability/logger.server";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";

// Verify Polar webhook signature
const verifyWebhook = (
  payload: string,
  signature: string,
  secret: string
): boolean => {
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  return signature === expected;
};

const getUserFromCustomerId = async (customerId: string) => {
  const clerk = await clerkClient();
  const users = await clerk.users.getUserList();

  const user = users.data.find(
    (currentUser: {
      id: string;
      privateMetadata: { polarCustomerId?: string };
    }) => currentUser.privateMetadata.polarCustomerId === customerId
  );

  return user;
};

const handleOrderCreated = async (data: {
  customerId?: string;
  productName?: string;
}) => {
  if (!data.customerId) {
    return;
  }

  const user = await getUserFromCustomerId(data.customerId);

  if (!user) {
    return;
  }

  analytics.capture({
    event: "User Purchased",
    distinctId: user.id,
    properties: {
      product: data.productName,
    },
  });
};

const handleSubscriptionCreated = async (data: {
  customerId?: string;
  productName?: string;
}) => {
  if (!data.customerId) {
    return;
  }

  const user = await getUserFromCustomerId(data.customerId);

  if (!user) {
    return;
  }

  analytics.capture({
    event: "User Subscribed",
    distinctId: user.id,
    properties: {
      product: data.productName,
    },
  });
};

const handleSubscriptionCanceled = async (data: {
  customerId?: string;
  productName?: string;
}) => {
  if (!data.customerId) {
    return;
  }

  const user = await getUserFromCustomerId(data.customerId);

  if (!user) {
    return;
  }

  analytics.capture({
    event: "User Unsubscribed",
    distinctId: user.id,
    properties: {
      product: data.productName,
    },
  });
};

export const POST = async (request: Request): Promise<Response> => {
  if (!env.POLAR_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Not configured", ok: false });
  }

  try {
    const body = await request.text();
    const headerPayload = await headers();
    const signature = headerPayload.get("polar-webhook-signature");

    if (!signature) {
      throw new Error("missing polar-webhook-signature header");
    }

    // Verify webhook signature
    if (!verifyWebhook(body, signature, env.POLAR_WEBHOOK_SECRET)) {
      throw new Error("invalid webhook signature");
    }

    const event = JSON.parse(body);

    switch (event.type) {
      case "order.created": {
        await handleOrderCreated(event.data);
        break;
      }
      case "subscription.created": {
        await handleSubscriptionCreated(event.data);
        break;
      }
      case "subscription.canceled": {
        await handleSubscriptionCanceled(event.data);
        break;
      }
      default: {
        logger.warn({ eventType: event.type }, "Unhandled webhook event type");
      }
    }

    await analytics.shutdown();

    return NextResponse.json({ result: event, ok: true });
  } catch (error) {
    const message = parseError(error);

    logger.error({ err: error, message }, "Polar webhook processing failed");

    return NextResponse.json(
      {
        message: "something went wrong",
        ok: false,
      },
      { status: 500 }
    );
  }
};

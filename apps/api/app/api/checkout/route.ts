import { createError, withEvlog } from "@repo/observability";
import { NextResponse } from "next/server";
import { withMetrics } from "@/lib/with-metrics";

/**
 * Example checkout endpoint with evlog wide events
 * Shows structured logging with context accumulation
 */
/**
 * @swagger
 * /api/checkout:
 *   post:
 *     summary: Create a checkout order
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CheckoutRequest'
 *     responses:
 *       200:
 *         description: Checkout completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CheckoutResponse'
 *       402:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const checkoutRouteHandler = withEvlog(async (req: Request, { log }) => {
  const body = await req.json();
  const { cartId, userId } = body as { cartId: string; userId: string };

  // Set initial context
  log.set({
    endpoint: "/api/checkout",
    cartId,
    userId,
  });

  // Simulate cart lookup
  const cart = { items: 3, total: 9999, currency: "USD" };
  log.set({ cart });

  // Simulate payment processing
  const checkout = { id: "checkout_123", success: true };
  log.set({ polar: { checkoutId: checkout.id } });

  if (!checkout.success) {
    throw createError({
      status: 402,
      message: "Payment failed",
      why: "Card declined by issuer",
      fix: "Try a different payment method",
    });
  }

  // Success - one wide event with all context
  log.set({
    orderId: checkout.id,
    checkoutStatus: "complete",
  });

  return NextResponse.json({
    orderId: checkout.id,
    status: "success",
  });
});

export const POST = withMetrics("/api/checkout", checkoutRouteHandler);

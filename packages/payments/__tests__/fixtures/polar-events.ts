// Mock webhook payloads for Polar.sh events
// Based on Polar.sh webhook event structure
// https://docs.polar.sh/api/webhooks

export const checkoutCreatedEvent = {
  type: "checkout.created",
  data: {
    id: "checkout_test_123",
    url: "https://sandbox.polar.sh/checkout/checkout_test_123",
    status: "confirmed",
    customer_name: "Test User",
    customer_email: "test@example.com",
    customer_ip_address: "127.0.0.1",
    amount: 1000,
    currency: "usd",
    product_id: "prod_test_456",
    product_name: "Test Product",
    price_id: "price_test_789",
    subscription_id: null,
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
    modified_at: "2024-01-01T00:00:00Z",
  },
};

export const subscriptionCreatedEvent = {
  type: "subscription.created",
  data: {
    id: "sub_test_123",
    status: "active",
    current_period_start: "2024-01-01T00:00:00Z",
    current_period_end: "2024-02-01T00:00:00Z",
    cancel_at_period_end: false,
    canceled_at: null,
    customer_id: "cus_test_456",
    product_id: "prod_test_789",
    price_id: "price_test_012",
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
    modified_at: "2024-01-01T00:00:00Z",
  },
};

export const subscriptionCancelledEvent = {
  type: "subscription.cancelled",
  data: {
    id: "sub_test_123",
    status: "cancelled",
    current_period_start: "2024-01-01T00:00:00Z",
    current_period_end: "2024-02-01T00:00:00Z",
    cancel_at_period_end: true,
    canceled_at: "2024-01-15T00:00:00Z",
    customer_id: "cus_test_456",
    product_id: "prod_test_789",
    price_id: "price_test_012",
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
    modified_at: "2024-01-15T00:00:00Z",
  },
};

export const paymentSucceededEvent = {
  type: "payment.succeeded",
  data: {
    id: "pay_test_123",
    amount: 1000,
    currency: "usd",
    status: "succeeded",
    customer_id: "cus_test_456",
    subscription_id: "sub_test_789",
    product_id: "prod_test_012",
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
  },
};

export const paymentFailedEvent = {
  type: "payment.failed",
  data: {
    id: "pay_test_456",
    amount: 1000,
    currency: "usd",
    status: "failed",
    error_message: "Card declined",
    customer_id: "cus_test_789",
    subscription_id: "sub_test_012",
    product_id: "prod_test_345",
    metadata: {},
    created_at: "2024-01-01T00:00:00Z",
  },
};

// Helper to create webhook signature
export function createMockSignature(payload: string, secret: string): string {
  // In real implementation, this would use crypto to create HMAC
  // For testing, we'll use a mock signature
  return `mock_signature_${secret.slice(-8)}_${Buffer.from(payload).toString("base64").slice(0, 8)}`;
}

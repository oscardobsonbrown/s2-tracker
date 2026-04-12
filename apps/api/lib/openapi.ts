import { createSwaggerSpec } from "next-swagger-doc";

/**
 * OpenAPI specification for next-ship API
 * Auto-generated from JSDoc comments in route handlers
 */

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "next-ship API",
        version: "1.0.0",
        description: "Production-grade API for next-ship application",
        contact: {
          name: "API Support",
          email: "api@next-ship.dev",
        },
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
          description: "Local development",
        },
        {
          url: "https://api.next-ship.dev",
          description: "Production",
        },
      ],
      tags: [
        { name: "Health", description: "Health check endpoints" },
        { name: "Checkout", description: "Payment and order processing" },
        { name: "Metrics", description: "Operational and performance metrics" },
        { name: "Webhooks", description: "Incoming webhook handlers" },
        { name: "Cron", description: "Scheduled job endpoints" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          apiKeyAuth: {
            type: "apiKey",
            in: "header",
            name: "X-API-Key",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: {
                type: "string",
                description: "Error message",
              },
              code: {
                type: "string",
                description: "Error code",
              },
              why: {
                type: "string",
                description: "Reason for the error",
              },
              fix: {
                type: "string",
                description: "Suggested fix",
              },
            },
          },
          CheckoutRequest: {
            type: "object",
            required: ["cartId", "userId"],
            properties: {
              cartId: {
                type: "string",
                description: "Cart identifier",
              },
              userId: {
                type: "string",
                description: "User identifier",
              },
              paymentMethod: {
                type: "string",
                enum: ["card", "paypal", "crypto"],
                description: "Payment method",
              },
            },
          },
          CheckoutResponse: {
            type: "object",
            properties: {
              orderId: {
                type: "string",
                description: "Created order ID",
              },
              status: {
                type: "string",
                enum: ["success", "pending", "failed"],
              },
              amount: {
                type: "number",
                description: "Charged amount in cents",
              },
            },
          },
        },
      },
    },
  });

  return spec;
};

export default getApiDocs;

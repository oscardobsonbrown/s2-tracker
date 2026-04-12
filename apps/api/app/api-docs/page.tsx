import { getApiDocs } from "@/lib/openapi";
import { SwaggerUI } from "@/lib/swagger-ui";

/**
 * Swagger UI for API documentation
 * Auto-generated from OpenAPI spec
 */

export default function ApiDocsPage() {
  const spec = getApiDocs() as Record<string, unknown>;

  return (
    <section className="container mx-auto p-4">
      <SwaggerUI spec={spec} />
    </section>
  );
}

import { database, ilike, pages } from "@repo/database";
import { logger } from "@repo/observability/logger.server";
import { redirect } from "next/navigation";
import { Header } from "../components/header";

interface SearchPageProperties {
  searchParams: Promise<{
    q: string;
  }>;
}

const searchLogger = logger.child({
  app: "app",
  page: "/search",
});

export const generateMetadata = async ({
  searchParams,
}: SearchPageProperties) => {
  const { q } = await searchParams;

  return {
    title: `${q} - Search results`,
    description: `Search results for ${q}`,
  };
};

const SearchPage = async ({ searchParams }: SearchPageProperties) => {
  const { q } = await searchParams;

  if (!q) {
    searchLogger.info("Search page redirected because query was empty");
    redirect("/");
  }

  const pagesData = await database
    .select()
    .from(pages)
    .where(ilike(pages.name, `%${q}%`));

  searchLogger.info(
    {
      queryLength: q.length,
      resultCount: pagesData.length,
    },
    "Search results loaded"
  );

  return (
    <>
      <Header page="Search" pages={["Building Your Application"]} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {pagesData.map((page) => (
            <div className="aspect-video rounded-xl bg-muted/50" key={page.id}>
              {page.name}
            </div>
          ))}
        </div>
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min" />
      </div>
    </>
  );
};

export default SearchPage;

import { database, pages } from "@repo/database";
import { logger } from "@repo/observability/logger.server";
import type { Metadata } from "next";
import { Header } from "./components/header";

const title = "Acme Inc";
const description = "My application.";

export const metadata: Metadata = {
  title,
  description,
};

const dashboardLogger = logger.child({
  app: "app",
  page: "/",
});

const App = async () => {
  const pagesData = await database.select().from(pages);

  dashboardLogger.info(
    {
      pageCount: pagesData.length,
    },
    "Dashboard data loaded"
  );

  return (
    <>
      <Header page="Data Fetching" pages={["Building Your Application"]} />
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

export default App;

import { logger } from "@repo/observability/logger.server";
import type { Metadata } from "next";
import { Header } from "../../components/header";
import { RankingLabClient } from "./ranking-lab-client";

export const metadata: Metadata = {
  title: "Travel Ranking Lab",
  description:
    "Tune the ski resort forecast ranking model and inspect results.",
};

const rankingLabLogger = logger.child({
  app: "app",
  page: "/travel/ranking-lab",
});

const RankingLabPage = () => {
  rankingLabLogger.info("Rendering travel ranking lab page");

  return (
    <>
      <Header page="Ranking Lab" pages={["Operations", "Travel"]} />
      <RankingLabClient />
    </>
  );
};

export default RankingLabPage;

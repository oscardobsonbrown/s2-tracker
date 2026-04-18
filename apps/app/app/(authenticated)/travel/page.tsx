import { logger } from "@repo/observability/logger.server";
import type { Metadata } from "next";
import { Header } from "../components/header";
import { TravelTools } from "./travel-tools";

export const metadata: Metadata = {
  title: "Travel Conditions",
  description: "Search flights and check surf or snow conditions.",
};

const travelLogger = logger.child({
  app: "app",
  page: "/travel",
});

const TravelPage = () => {
  travelLogger.info("Rendering travel conditions page");

  return (
    <>
      <Header page="Travel" pages={["Operations"]} />
      <TravelTools />
    </>
  );
};

export default TravelPage;

import { auth, currentUser } from "@repo/auth/server";
import { SidebarProvider } from "@repo/design-system/components/ui/sidebar";
import { showBetaFeature } from "@repo/feature-flags";
import { logger } from "@repo/observability/logger.server";
import type { ReactNode } from "react";
import { NotificationsProvider } from "./components/notifications-provider";
import { GlobalSidebar } from "./components/sidebar";

type AppLayoutProperties = {
  readonly children: ReactNode;
};

const layoutLogger = logger.child({
  app: "app",
  layout: "authenticated",
});

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const user = await currentUser();
  const { redirectToSignIn } = await auth();
  const betaFeature = await showBetaFeature();

  if (!user) {
    layoutLogger.warn("Authenticated layout rendered without a user");
    return redirectToSignIn();
  }

  layoutLogger.info(
    {
      userId: user.id,
      betaFeature: Boolean(betaFeature),
    },
    "Authenticated layout rendered"
  );

  return (
    <NotificationsProvider userId={user.id}>
      <SidebarProvider>
        <GlobalSidebar>
          {betaFeature ? (
            <div className="m-4 rounded-full bg-blue-500 p-1.5 text-center text-sm text-white">
              Beta feature now available
            </div>
          ) : null}
          {children}
        </GlobalSidebar>
      </SidebarProvider>
    </NotificationsProvider>
  );
};

export default AppLayout;

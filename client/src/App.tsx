import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Shops from "@/pages/shops";
import Employees from "@/pages/employees";
import Analytics from "@/pages/analytics";
import Subscriptions from "@/pages/subscriptions";
import Expenses from "@/pages/expenses";
import Referrals from "@/pages/referrals";
import Support from "@/pages/support";
import Maintenance from "@/pages/maintenance";
import Settings from "@/pages/settings";
import DashboardLayout from "@/components/layout/dashboard-layout";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <DashboardLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/shops" component={Shops} />
          <Route path="/employees" component={Employees} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/subscriptions" component={Subscriptions} />
          <Route path="/expenses" component={Expenses} />
          <Route path="/referrals" component={Referrals} />
          <Route path="/support" component={Support} />
          <Route path="/maintenance" component={Maintenance} />
          <Route path="/settings" component={Settings} />
        </DashboardLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

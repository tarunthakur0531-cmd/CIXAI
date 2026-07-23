import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Memories from "./pages/Memories";
import BrainChat from "./pages/BrainChat";
import KnowledgeGraph from "./pages/KnowledgeGraph";
import Tasks from "./pages/Tasks";
import Insights from "./pages/Insights";
import Privacy from "./pages/Privacy";
import Models from "./pages/Models";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/memories"} component={Memories} />
      <Route path={"/chat"} component={BrainChat} />
      <Route path={"/graph"} component={KnowledgeGraph} />
      <Route path={"/tasks"} component={Tasks} />
      <Route path={"/insights"} component={Insights} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/models"} component={Models} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

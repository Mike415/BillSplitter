// Design: Ledger Craft — Swiss typographic fintech aesthetic
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BillProvider } from "./contexts/BillContext";
import Home from "./pages/Home";

// Derive the base path from Vite's import.meta.env.BASE_URL so routing
// works both locally (base = "/") and on GitHub Pages (base = "/BillSplitter/").
const base = import.meta.env.BASE_URL.replace(/\/$/, ""); // strip trailing slash

function AppRouter() {
  return (
    <Router base={base}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <BillProvider>
          <TooltipProvider>
            <Toaster />
            <AppRouter />
          </TooltipProvider>
        </BillProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

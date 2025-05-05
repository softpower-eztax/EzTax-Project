import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import PersonalInfo from "@/pages/PersonalInfo";
import IncomePage from "@/pages/Income";
import Deductions from "@/pages/Deductions";
import TaxCredits from "@/pages/TaxCredits";
import AdditionalTax from "@/pages/AdditionalTax";
import Review from "@/pages/Review";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/personal-info" component={PersonalInfo} />
      <Route path="/income" component={IncomePage} />
      <Route path="/deductions" component={Deductions} />
      <Route path="/tax-credits" component={TaxCredits} />
      <Route path="/additional-tax" component={AdditionalTax} />
      <Route path="/review" component={Review} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="container mx-auto px-4 py-8 flex-grow">
            <Router />
          </main>
          <Footer />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

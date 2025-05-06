import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import PersonalInfo from "@/pages/PersonalInfo";
import IncomePage from "@/pages/Income-fixed";
import AdditionalIncomePage from "@/pages/AdditionalIncome";
import AdditionalAdjustmentsPage from "@/pages/AdditionalAdjustments";
import Deductions from "@/pages/Deductions";
import TaxCredits from "@/pages/TaxCredits-new";
import AdditionalTax from "@/pages/AdditionalTax";
import Review from "@/pages/Review";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { TaxProvider } from "@/context/TaxContext";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/personal-info" component={PersonalInfo} />
      <ProtectedRoute path="/income" component={IncomePage} />
      <ProtectedRoute path="/additional-income" component={AdditionalIncomePage} />
      <ProtectedRoute path="/additional-adjustments" component={AdditionalAdjustmentsPage} />
      <ProtectedRoute path="/deductions" component={Deductions} />
      <ProtectedRoute path="/tax-credits" component={TaxCredits} />
      <ProtectedRoute path="/additional-tax" component={AdditionalTax} />
      <ProtectedRoute path="/review" component={Review} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TaxProvider>
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
        </TaxProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

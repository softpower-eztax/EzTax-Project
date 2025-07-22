import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { File, FileText, Clock, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";

const Home: React.FC = () => {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { messages } = useLanguage();

  // 자동 데이터 주입 제거 - 사용자가 직접 입력하도록 변경

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-12 text-center py-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-2">
          {messages.home.title}
        </h1>
        <p
          className="text-2xl md:text-3xl font-bold text-gray-600 mb-4 tracking-wide"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {messages.home.subtitle}
        </p>
        <p className="text-xl text-gray-dark mb-8 text-center">
          {messages.home.tagline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-green-500 hover:bg-green-600 text-white font-bold w-full sm:w-64"
                  onClick={() => navigate("/personal-info")}
                >
                  {messages.home.taxSimulatorButton}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{messages.home.taxSimulatorTooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            size="lg"
            className="bg-primary hover:bg-primary-dark text-white font-bold w-full sm:w-64"
            onClick={() => navigate("/retirement-score")}
          >
            {messages.home.retirementDiagnosisButton}
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary-dark text-center mb-8">
          {messages.home.whyEzTax}
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <File className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.easyCalculation}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                {messages.home.featureDescriptions.easyCalculation}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.maxDeductions}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                {messages.home.featureDescriptions.maxDeductions}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.retirementPlanning}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                {messages.home.featureDescriptions.retirementPlanning}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">{messages.home.features.safeAndPrivate}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">
                {messages.home.featureDescriptions.safeAndPrivate}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button
            variant="ghost"
            className="text-gray-600 hover:text-primary underline"
            onClick={() => navigate("/about")}
          >
            {messages.home.learnMoreAbout}
          </Button>
        </div>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark">
              {messages.home.readyToFile}
            </CardTitle>
            <CardDescription>
              {messages.home.completeTaxReturn}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              {messages.home.processDescription}
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li>
                <strong>{messages.navigation.personalInfo}</strong> - {messages.home.stepDescriptions.personalInfo}
              </li>
              <li>
                <strong>{messages.navigation.income}</strong> - {messages.home.stepDescriptions.income}
              </li>
              <li>
                <strong>{messages.navigation.deductions}</strong> - {messages.home.stepDescriptions.deductions}
              </li>
              <li>
                <strong>{messages.navigation.taxCredits}</strong> - {messages.home.stepDescriptions.taxCredits}
              </li>
              <li>
                <strong>{messages.navigation.additionalTax}</strong> - {messages.home.stepDescriptions.additionalTax}
              </li>
              <li>
                <strong>{messages.navigation.review}</strong> - {messages.home.stepDescriptions.review}
              </li>
            </ol>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() =>
                user ? navigate("/personal-info") : navigate("/auth")
              }
            >
              {user ? messages.home.startNowAuth : messages.home.startWithLogin}
            </Button>
            <Button
              size="lg"
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold"
              onClick={() => navigate("/personal-info")}
            >
              {messages.home.taxSimulatorCTA}
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default Home;

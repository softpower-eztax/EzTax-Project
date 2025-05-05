import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { File, FileText, Clock, Shield } from 'lucide-react';

const Home: React.FC = () => {
  const [, navigate] = useLocation();

  return (
    <div className="max-w-5xl mx-auto">
      <section className="mb-12 text-center py-10">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-primary-dark mb-4">
          Simple Tax Filing Made Easy
        </h1>
        <p className="text-xl text-gray-dark max-w-3xl mx-auto mb-8">
          EzTax helps you file your taxes with confidence through a simple step-by-step process.
        </p>
        <Button 
          size="lg" 
          className="bg-primary hover:bg-primary-dark text-white font-bold"
          onClick={() => navigate('/personal-info')}
        >
          Start Your 2023 Tax Return
        </Button>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-heading font-bold text-primary-dark text-center mb-8">
          Why Choose EzTax?
        </h2>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <File className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Simple Process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">Step-by-step guidance through each section of your tax return.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <FileText className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Maximum Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">We help identify all deductions and credits you're eligible for.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Clock className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Save & Resume</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">Work at your own pace with automatic saving of your progress.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="text-lg">Secure & Private</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-dark">Your data is encrypted and protected with bank-level security.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-heading text-primary-dark">Ready to file your taxes?</CardTitle>
            <CardDescription>
              Complete your 2023 tax return in as little as 30 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our step-by-step process guides you through five easy sections:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li><strong>Personal Information</strong> - Basic details and filing status</li>
              <li><strong>Deductions</strong> - Choose standard or itemized deductions</li>
              <li><strong>Tax Credits</strong> - Identify credits you qualify for</li>
              <li><strong>Additional Tax</strong> - Self-employment and other income</li>
              <li><strong>Review & Calculate</strong> - Finalize and generate your return</li>
            </ol>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold"
              onClick={() => navigate('/personal-info')}
            >
              Get Started Now
            </Button>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default Home;

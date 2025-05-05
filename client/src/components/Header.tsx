import React from 'react';
import Logo from './Logo';
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useTaxContext } from '@/context/TaxContext';

const Header: React.FC = () => {
  const { toast } = useToast();
  const [location] = useLocation();
  const { saveTaxReturn } = useTaxContext();

  const handleSaveProgress = async () => {
    try {
      await saveTaxReturn();
      toast({
        title: "Progress saved",
        description: "Your tax return progress has been saved successfully.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error saving progress",
        description: "There was a problem saving your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Only show buttons on tax form pages
  const showButtons = location !== '/' && location !== '/not-found';

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Logo />
        
        {showButtons && (
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              className="text-primary-dark hover:text-primary flex items-center text-sm"
              onClick={handleSaveProgress}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Progress
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-primary-dark hover:text-primary flex items-center text-sm"
              onClick={() => {
                toast({
                  title: "Help & Support",
                  description: "Our support team is available Monday-Friday, 9AM-5PM ET at support@eztax.com",
                });
              }}
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;

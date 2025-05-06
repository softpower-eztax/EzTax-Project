import React from 'react';
import ProgressTracker from '@/components/ProgressTracker';
import StepNavigation from '@/components/StepNavigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function IncomePage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <ProgressTracker currentStep={2} />
      </div>
      
      <div className="md:flex gap-8">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-heading text-primary-dark">소득 정보 (Income Information)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">근로소득 (Earned Income)</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col justify-center h-full">
                    <div className="flex justify-between">
                      <label>급여, 월급, 팁 (Wages, Salaries, Tips)</label>
                    </div>
                    <input
                      type="number"
                      className="rounded-md border p-2 mt-1"
                      step="0.01"
                      min="0"
                      defaultValue="0"
                    />
                  </div>
                  
                  <div className="border rounded-md p-3 bg-gray-50/50">
                    <p className="text-sm text-gray-700 mb-2">W-2입력(없으면 직접 입력)</p>
                    <div className="flex flex-col items-start gap-2">
                      <div className="w-full flex items-center gap-3">
                        <div className="flex items-center">
                          <label className="cursor-pointer mr-2">
                            <div className="flex items-center gap-1 rounded-md border bg-white px-3 py-1 text-xs shadow-sm">
                              <span>업로드</span>
                            </div>
                            <input 
                              type="file" 
                              accept=".pdf,.jpg,.jpeg,.png" 
                              className="hidden" 
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8">
            <StepNavigation 
              prevStep="/personal-info" 
              nextStep="/deductions"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Route, Redirect } from "wouter";
import React from 'react';

// Convert FC to function that returns JSX.Element
type ComponentType = React.FC<any> | (() => React.JSX.Element);

const wrapComponent = (Component: ComponentType): (() => React.JSX.Element) => {
  return () => <Component />;
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: ComponentType;
}) {
  // 인증 체크를 일시적으로 비활성화
  const { isLoading } = useAuth();
  const WrappedComponent = wrapComponent(Component);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  // 인증 여부에 관계없이 항상 접근 허용
  return <Route path={path} component={WrappedComponent} />;
}
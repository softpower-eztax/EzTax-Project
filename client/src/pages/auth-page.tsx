import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/LanguageContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, User, Mail, Lock, LogIn, UserPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { FcGoogle } from "react-icons/fc";
import { SiApple } from "react-icons/si";

// Strong password validation function
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain uppercase letter")
  .regex(/[$*!#]/, "Must contain special character: $, *, !, #");

// Extend the insertUserSchema to include password confirmation
const registerSchema = insertUserSchema
  .extend({
    password: passwordSchema,
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

// Create a login schema
const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;
type LoginFormValues = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { messages } = useLanguage();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
  });

  // Handle login submission
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Handle register submission
  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove passwordConfirm from data before sending to API
    const { passwordConfirm, ...registerData } = data;
    registerMutation.mutate(registerData);
  };

  // If loading or redirecting after successful auth
  if (isLoading || user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-160px)] flex-col md:flex-row items-center justify-center p-4 md:p-8">
      {/* Left Column - Form */}
      <div className="w-full max-w-md p-4">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? messages.auth.loginTitle : messages.auth.registerTitle}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? messages.auth.loginDescription
                : messages.auth.registerDescription}
            </CardDescription>
          </CardHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{messages.auth.loginTab}</TabsTrigger>
              <TabsTrigger value="register">{messages.auth.registerTab}</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">{messages.auth.username}</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        className="pl-10"
                        placeholder="username"
                        {...loginForm.register("username")}
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{messages.auth.password}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        className="pl-10"
                        placeholder="********"
                        {...loginForm.register("password")}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...(Processing...)
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        {messages.auth.loginButton}
                      </div>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => window.location.href = '/auth/google'}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    {messages.auth.googleLogin}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={() => window.location.href = '/auth/apple'}
                  >
                    <SiApple className="mr-2 h-4 w-4" />
                    {messages.auth.appleLogin}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">
                      {messages.auth.username}
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-username"
                        className="pl-10"
                        placeholder="username"
                        {...registerForm.register("username")}
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">{messages.auth.email}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        className="pl-10"
                        placeholder="example@email.com"
                        {...registerForm.register("email")}
                      />
                    </div>
                    {registerForm.formState.errors.email && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">
                      {messages.auth.password}
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        className="pl-10"
                        placeholder="********"
                        {...registerForm.register("password")}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      최소 8자, 대문자, 특수기호($, *, !, #) 포함 필수
                    </p>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password-confirm">
                      비밀번호 확인(Confirm Password)
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password-confirm"
                        type="password"
                        className="pl-10"
                        placeholder="********"
                        {...registerForm.register("passwordConfirm")}
                      />
                    </div>
                    {registerForm.formState.errors.passwordConfirm && (
                      <p className="text-sm text-destructive">
                        {registerForm.formState.errors.passwordConfirm.message}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                  <Button
                    className="w-full"
                    type="submit"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...(Processing...)
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        회원가입(Register)
                      </div>
                    )}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full"
                    onClick={() => window.location.href = '/auth/google'}
                  >
                    <FcGoogle className="mr-2 h-4 w-4" />
                    {messages.auth.googleLogin}
                  </Button>

                  <Button
                    variant="outline"
                    type="button"
                    className="w-full bg-black text-white hover:bg-gray-800"
                    onClick={() => window.location.href = '/auth/apple'}
                  >
                    <SiApple className="mr-2 h-4 w-4" />
                    {messages.auth.appleLogin}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Right Column - Hero Content */}
      <div className="w-full max-w-md p-4 mt-8 md:mt-0">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary">
            쉽고 빠른 세금 계산(Easy and Fast Calculation)
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            EzTax와 함께 세금 계산을 간편하게. 로그인하고 쉽게 세금을
            관리하세요. (Make tax calculation simple with EzTax. Login and
            manage your taxes with ease.)
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14Z"></path>
                  <path d="M7 22V11"></path>
                  <path d="M3 15h4"></path>
                  <path d="M3 18h4"></path>
                  <path d="M3 11h4"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">
                  편리한 세금 계산(Convenient Tax Calculation)
                </h3>
                <p className="text-sm text-gray-600">
                  간편한 단계별 접근 방식으로 세금 계산(Step-by-step approach to
                  tax calculation)
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path>
                  <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path>
                  <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path>
                  <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">
                  맞춤형 세금 조언(Personalized Tax Advice)
                </h3>
                <p className="text-sm text-gray-600">
                  귀하의 상황에 맞는 세금 전략(Tax strategies tailored to your
                  situation)
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-primary/10 p-3 rounded-full mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <rect
                    width="18"
                    height="11"
                    x="3"
                    y="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">
                  안전한 데이터 보호(Secure Data Protection)
                </h3>
                <p className="text-sm text-gray-600">
                  모든 개인 정보는 안전하게 암호화(All personal information
                  securely encrypted)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import fs from "fs";
import path from "path";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const PostgresSessionStore = connectPg(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "super-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({ 
      pool,
      createTableIfMissing: true
    }),
    cookie: {
      secure: false, // Allow cookies over HTTP for development
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // 로컬 인증 전략
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );
  
  // 구글 OAuth 인증 전략
  try {
    // 환경변수에서 우선 확인, 없으면 JSON 파일 사용
    let clientID = process.env.GOOGLE_CLIENT_ID;
    let clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientID || !clientSecret) {
      // JSON 파일에서 Google 클라이언트 정보 읽기
      const clientSecretPath = path.join(process.cwd(), 'client-secret.json');
      const clientSecretContent = fs.readFileSync(clientSecretPath, 'utf-8');
      const clientSecretJson = JSON.parse(clientSecretContent);
      
      clientID = clientSecretJson.web.client_id;
      clientSecret = clientSecretJson.web.client_secret;
    }
    
    if (!clientID || !clientSecret) {
      throw new Error('Google OAuth credentials not found');
    }
    
    console.log('Google OAuth 설정 중:', { 
      clientID: clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET',
      clientSecret: clientSecret ? 'SET' : 'NOT SET',
      callbackURL: "https://3e18f96e-0fbf-4af6-b766-cfbae9f2437b-00-17nnd6cbvtwuy.janeway.replit.dev/auth/google/callback"
    });
    
    passport.use(
      new GoogleStrategy(
        {
          clientID: clientID,
          clientSecret: clientSecret,
          callbackURL: "https://web-data-pro-kloombergtv.replit.app/auth/google/callback",
          proxy: true
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log('Google OAuth 콜백 처리 중:', {
              profileId: profile.id,
              displayName: profile.displayName,
              email: profile.emails?.[0]?.value
            });
            
            // 구글 ID로 사용자 확인
            let user = await storage.getUserByGoogleId(profile.id);
            
            // 사용자가 없으면 새로 생성
            if (!user) {
              console.log('새 Google 사용자 생성 중...');
              // 고유한 사용자명 생성
              const username = `google_${profile.id}`;
              // 이메일 가져오기 (있을 경우)
              const email = profile.emails && profile.emails[0]?.value;
              
              // 임의의 비밀번호 생성 (실제로 사용되지 않음)
              const randomPass = randomBytes(16).toString("hex");
              
              user = await storage.createUser({
                username,
                password: await hashPassword(randomPass),
                googleId: profile.id,
                email: email || "",
                displayName: profile.displayName || username,
              });
              
              console.log('새 Google 사용자 생성 완료:', user.username);
            } else {
              console.log('기존 Google 사용자 로그인:', user.username);
            }
            
            return done(null, user);
          } catch (error) {
            console.error('Google OAuth 처리 중 오류:', error);
            return done(error);
          }
        }
      )
    );
    
    console.log("구글 로그인 설정 완료");
  } catch (error) {
    console.error("구글 인증 설정 중 오류 발생:", error);
  }

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      console.log('Deserializing user ID:', id);
      const user = await storage.getUserById(id);
      if (!user) {
        console.log('User not found during deserialization:', id);
        return done(null, false);
      }
      console.log('User deserialized successfully:', user.username);
      done(null, user);
    } catch (error) {
      console.error('Deserialization error:', error);
      done(null, false);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "사용자 이름이 이미 존재합니다(Username already exists)" });
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: SelectUser | false, info: { message: string }) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "아이디나 비밀번호가 올바르지 않습니다(Invalid username or password)" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "로그아웃 중 오류가 발생했습니다(Error during logout)" });
      }
      
      // 세션 파괴
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
          return res.status(500).json({ message: "세션 정리 중 오류가 발생했습니다(Error clearing session)" });
        }
        
        // 세션 쿠키 삭제
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "로그아웃 성공(Logout successful)" });
      });
    });
  });

  // 구글 인증 라우트 - 디버깅용 정보 포함
  app.get(
    "/auth/google",
    (req, res, next) => {
      console.log("구글 인증 요청 받음: ", req.url);
      console.log("요청 호스트:", req.get('host'));
      console.log("프로토콜:", req.protocol);
      console.log("전체 URL:", `${req.protocol}://${req.get('host')}${req.originalUrl}`);
      next();
    },
    passport.authenticate("google", { 
      scope: ["profile", "email"],
      prompt: "select_account"
    })
  );

  app.get(
    "/auth/google/callback",
    (req, res, next) => {
      console.log("구글 콜백 받음: ", req.url);
      console.log("Query params:", req.query);
      next();
    },
    passport.authenticate("google", { 
      failureRedirect: "/auth?error=google_auth_failed",
      failureMessage: true,
      successMessage: true
    }),
    (req, res) => {
      // 인증 성공 시 홈페이지로 리다이렉트
      console.log("구글 인증 성공, 사용자:", req.user?.username);
      res.redirect("/?google_login=success");
    }
  );

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
}
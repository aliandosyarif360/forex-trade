import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';
const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('demo') &&
                    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('your_actual');

export default authMiddleware({
  publicRoutes: ["/", "/subscription", "/api/webhook", "/api/health"],
  
  beforeAuth: (req) => {
    // If no Clerk key configured, allow all routes but show warning
    if (!hasClerkKey) {
      console.warn('Clerk authentication not configured. Please set up your Clerk keys.');
      return NextResponse.next();
    }
  },
  
  afterAuth(auth, req, evt) {
    // If no Clerk key configured, allow all routes
    if (!hasClerkKey) {
      return NextResponse.next();
    }

    // Jika user tidak login dan mencoba akses protected route
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }

    // Jika user sudah login dan mencoba akses sign-in/sign-up
    if (auth.userId && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
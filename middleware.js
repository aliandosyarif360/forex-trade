import { NextResponse } from "next/server";

// Check if we're in demo mode
const isDemoMode = process.env.DEMO_MODE === 'true';
const hasClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && 
                    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes('demo');

// Simple middleware for demo mode
function demoMiddleware(req) {
  // Allow all routes in demo mode
  return NextResponse.next();
}

// Clerk middleware for production
async function clerkMiddleware(req) {
  try {
    const { authMiddleware } = await import("@clerk/nextjs");
    
    return authMiddleware({
      publicRoutes: ["/", "/subscription", "/api/webhook", "/api/health"],
      
      afterAuth(auth, req, evt) {
        // Jika user tidak login dan mencoba akses protected route
        if (!auth.userId && !auth.isPublicRoute) {
          return NextResponse.redirect(new URL("/", req.url));
        }

        // Jika user login tapi mencoba akses dashboard
        if (auth.userId && req.nextUrl.pathname.startsWith("/dashboard")) {
          // Check jika user memiliki role premium
          const userRole = auth.sessionClaims?.metadata?.role;
          
          if (userRole !== "premium") {
            // Redirect ke halaman subscription jika bukan premium
            return NextResponse.redirect(new URL("/subscription", req.url));
          }
        }

        // Jika user premium mencoba akses subscription page
        if (auth.userId && req.nextUrl.pathname.startsWith("/subscription")) {
          const userRole = auth.sessionClaims?.metadata?.role;
          
          if (userRole === "premium") {
            // Redirect ke dashboard jika sudah premium
            return NextResponse.redirect(new URL("/dashboard", req.url));
          }
        }

        return NextResponse.next();
      },
    })(req);
  } catch (error) {
    console.error('Clerk middleware error:', error);
    return NextResponse.next();
  }
}

export default function middleware(req) {
  // Use demo middleware if in demo mode or no Clerk key
  if (isDemoMode || !hasClerkKey) {
    return demoMiddleware(req);
  }
  
  // Use Clerk middleware for production
  return clerkMiddleware(req);
}

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
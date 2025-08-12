import GoogleProvider from "next-auth/providers/google"
import { NextAuthOptions } from "next-auth"
import { connect } from "@/dbConfig/dbConfig"
import candidates from "@/models/candidates"
import College from "@/models/colleges"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Only validate college emails for candidates
      if (account?.provider === "google" && profile?.email) {
        const email = profile.email as string;
        
        // For admin/hr/interviewer, no college validation needed
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const hrEmails = process.env.HR_EMAILS?.split(",") || [];
        
        if (email.endsWith("@devxconsultancy.com") || 
            adminEmails.includes(email) || 
            hrEmails.includes(email)) {
          return true; // Allow admin/hr/interviewer login
        }
        
        // For candidates, we need to validate email domain
        // We'll do this in the jwt callback where we can access the college context
        return true;
      }
      
      return true;
    },

    async jwt({ token, account, profile, trigger, session }) {
  await connect();

  if (account?.provider === "google" && profile?.email) {
    
    // Always fetch the latest user data from database to ensure we have college context
    let user = await candidates.findOne({ email: profile.email });

    if (!user) {
      // Get admin emails from env and split into array
      const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
      const hrEmails = process.env.HR_EMAILS?.split(",") || [];

      // Determine role
      let role = "candidate";
      const email = profile.email;

      if (email.endsWith("@devxconsultancy.com")) {
        role = "interviewer";
      } else if (adminEmails.includes(email)) {
        role = "admin";
      } else if (hrEmails.includes(email)) {
        role = "hr";
      }

      // For candidates, NEVER auto-create here; validation route must create/update the user
      if (role === "candidate") {
        token.email = profile.email;
        token.username = profile.name?.replace(/\s+/g, "").toLowerCase();
        token.role = role;
        return token;
      } else {
        // Admin/HR/Interviewer login
        const userData: any = {
          email: profile.email,
          username: profile.name?.replace(/\s+/g, "").toLowerCase(),
          password: "",
          role,
        };
        
        user = await candidates.create(userData);
      }

      // --- Update lastLogin timestamp ---
      if (user) {
        await candidates.findByIdAndUpdate(user._id, { lastLogin: new Date() });
      }
    }

    // Set token properties
    if (user) {
      token._id = user._id.toString();
      token.email = user.email;
      token.username = user.username;
      token.role = user.role;
    } else {
      // For new candidates without a profile yet
      token.email = profile.email;
      token.username = profile.name?.replace(/\s+/g, "").toLowerCase();
      token.role = "candidate";
      // Don't set _id here - it will be set when user completes onboarding
      // This will redirect to onboarding where they can complete their profile
    }
    
    // Add college context to token if available
    if (user.collegeId) {
      token.collegeId = user.collegeId.toString();
      token.collegeSlug = user.collegeSlug;
      token.emailDomain = user.emailDomain;
    }
    
    // If we have a user but no _id in token, update it
    if (user && !token._id) {
      token._id = user._id.toString();
    }
    
    // For college candidates, ensure college context is always added if available in database
    if (user && user.collegeId && (!token.collegeId || !token.collegeSlug)) {
      token.collegeId = user.collegeId.toString();
      token.collegeSlug = user.collegeSlug;
      token.emailDomain = user.emailDomain;
    }
    
    // Always ensure college context is present if user has it in database
    if (user && user.collegeId) {
      token.collegeId = user.collegeId.toString();
      token.collegeSlug = user.collegeSlug;
      token.emailDomain = user.emailDomain;
    }
  }

  return token;
},

    async session({ session, token }) {
      if (session.user) {
        session.user._id = token._id as string || undefined
        session.user.email = token.email as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        
        // Add college context to session if available
        if (token.collegeId) {
          session.user.collegeId = token.collegeId as string
          session.user.collegeSlug = token.collegeSlug as string
          session.user.emailDomain = token.emailDomain as string
        }
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import { DefaultSession, DefaultUser } from "next-auth";
import { UserRole, SubscriptionTier } from "@pdf-to-audio/shared";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
      subscriptionTier: SubscriptionTier;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    subscriptionTier: SubscriptionTier;
  }
}


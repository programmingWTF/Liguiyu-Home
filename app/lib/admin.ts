import { auth } from "./auth";

export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user) return false;
  const role = (session.user as any).role;
  return role === "admin";
}

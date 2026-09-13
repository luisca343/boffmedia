import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/features/authOptions";
import { USER_ROLES } from "@boffmedia/shared/roles";

const CONSOLE_ROLES: readonly string[] = [
  USER_ROLES.BOFF_ADMIN,
  USER_ROLES.BOFF_ADMIN_CONTENT,
  USER_ROLES.BOFF_ADMIN_RELEASE,
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  // Gate 1: Require authentication
  if (!session?.user) {
    redirect("/entrar?returnTo=/admin");
  }

  // Gate 2: the console is section-authorized. BOFF_ADMIN remains the
  // superuser; release/content sub-roles are narrowed by AdminConsole.
  const canOpenConsole = session.user.roles?.some((role) =>
    CONSOLE_ROLES.includes(role),
  );
  if (!canOpenConsole) {
    redirect("/entrar?returnTo=/admin");
  }

  return children;
}

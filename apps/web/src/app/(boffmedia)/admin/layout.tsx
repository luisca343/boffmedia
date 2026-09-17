import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/features/authOptions';
import { USER_ROLES } from '@boffmedia/shared/roles';

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  // Gate 1: Require authentication
  if (!session?.user) {
    redirect('/entrar?returnTo=/admin');
  }

  // Content administrators own the customer-facing changelog. The console
  // applies the narrower section filter; this layout only decides whether the
  // account may enter the admin surface at all.
  if (!session.user.roles?.some((role) =>
    role === USER_ROLES.BOFF_ADMIN || role === USER_ROLES.BOFF_ADMIN_CONTENT
  )) {
    redirect('/entrar?returnTo=/admin');
  }

  return children;
}

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

  // Gate 2: Require BOFF_ADMIN role
  if (!session.user.roles?.includes(USER_ROLES.BOFF_ADMIN)) {
    redirect('/entrar?returnTo=/admin');
  }

  return children;
}

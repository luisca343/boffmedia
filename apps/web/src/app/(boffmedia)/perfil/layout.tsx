import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/features/authOptions';

export default async function PerfilLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  // Require authentication to access profile
  if (!session?.user) {
    redirect('/entrar?returnTo=/perfil');
  }

  return children;
}

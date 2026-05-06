import { GlobalProviders } from '../GlobalProviders';

export default function LocalTestLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <GlobalProviders>
      {children}
    </GlobalProviders>
  );
}

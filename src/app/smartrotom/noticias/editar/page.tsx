"use client";

import { LoadingScreen } from '@/components/smartrotom/Loading';
import dynamic from 'next/dynamic';

// Use dynamic import for the NewsEditor to ensure client-side rendering
const NewsEditor = dynamic(() => import("./_components/NewsEditor"), {
  loading: () => <LoadingScreen />,
  ssr: false
});

export default function EditNewsPage() {
  return <NewsEditor />
}
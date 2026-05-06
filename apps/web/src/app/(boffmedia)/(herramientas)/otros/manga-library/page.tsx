import { redirect } from 'next/navigation';

export default function MangaLibraryPage() {
  redirect('/admin?section=manga-library');
}

'use client'

import dynamic from 'next/dynamic';
import { useGetNewsById } from '@/hooks/documents/useGetNewsById';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/primitives/alert"
import { AlertCircle, Loader2 } from 'lucide-react'
import { useBoffSession } from '@/services/useBoffSession';
import { USER_ROLES } from '@boffmedia/shared/roles';
import FurretHeader from '../../_components/Header';
import FurretFooter from '../../_components/Footer';
import PopArtWallpaper from '../../_components/PopArtWallpaper';
import PopStyles from '../../_components/PopStyles';
import { InternalLink } from "@/components/ui/navigation/Link";

const CustomEditor = dynamic(() => import('@/components/shared/ckeditor/TestEditor'), { ssr: false });

export default function EditNote({ params }: { params: { id: string } }) {
  const { hasRole, status, session } = useBoffSession();
  const token = session?.user?.accessToken ?? '';
  const canManageNews = hasRole([USER_ROLES.ROTOM_ADMIN, USER_ROLES.ROTOM_FURRET]);
  const { id } = params;
  const { article, error, isLoading } = useGetNewsById(id);

  if (status === 'loading') {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="bg-yellow-300 card-pop p-8 text-center">
            <h2 className="text-pop-4xl font-bold mb-6 text-pink-500 pop-shadow">
              ¡CARGANDO!
            </h2>
            <p className="text-pop-xl font-comic text-secondary-active">
              Verificando permisos... 🔐
            </p>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  if (!canManageNews) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <Alert className="card-pop bg-red-100 border-red-500 max-w-2xl">
            <AlertCircle className="h-8 w-8" />
            <AlertTitle className="text-pop-2xl font-bold pop-shadow text-red-600">
              ACCESO DENEGADO
            </AlertTitle>
            <AlertDescription className="text-pop-lg font-comic mt-4">
              Necesitas el rol ROTOM_ADMIN o ROTOM_FURRET para editar noticias.
            </AlertDescription>
            <div className="mt-6">
              <InternalLink 
                href="/smartrotom/furrettoday" 
                className="btn-pop-primary pop-focus animate-button-press"
              >
                🏠 Volver a Furret Today
              </InternalLink>
            </div>
          </Alert>
        </div>
        <PopStyles />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <div className="bg-yellow-300 card-pop p-8 text-center">
            <h2 className="text-pop-4xl font-bold mb-6 text-pink-500 pop-shadow">
              ¡CARGANDO!
            </h2>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-16 w-16 animate-spin text-secondary" />
            </div>
            <p className="text-pop-xl font-comic text-secondary-active">
              Furret está preparando el editor... 📝
            </p>
          </div>
        </div>
        <PopStyles />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <Alert className="card-pop bg-red-100 border-red-500 max-w-2xl">
            <AlertCircle className="h-8 w-8" />
            <AlertTitle className="text-pop-2xl font-bold pop-shadow text-red-600">
              ¡ERROR! 💥
            </AlertTitle>
            <AlertDescription className="text-pop-lg font-comic mt-4">
              No se pudo cargar el artículo. Por favor, intenta de nuevo más tarde.
            </AlertDescription>
            <div className="mt-6">
              <InternalLink 
                href="furrettoday/editar" 
                className="btn-pop-primary pop-focus animate-button-press"
              >
                🏠 Volver al Editor
              </InternalLink>
            </div>
          </Alert>
        </div>
        <PopStyles />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-full relative overflow-auto">
        <div className="absolute inset-0">
          <PopArtWallpaper />
        </div>
        <div className="relative z-10 min-h-full flex items-center justify-center p-8">
          <Alert className="card-pop bg-orange-100 border-orange-500 max-w-2xl">
            <AlertCircle className="h-8 w-8" />
            <AlertTitle className="text-pop-2xl font-bold pop-shadow text-orange-600">
              ¡NO ENCONTRADO! 🔍
            </AlertTitle>
            <AlertDescription className="text-pop-lg font-comic mt-4">
              El artículo solicitado no se pudo encontrar.
            </AlertDescription>
            <div className="mt-6">
              <InternalLink 
                href="furrettoday/editar" 
                className="btn-pop-primary pop-focus animate-button-press"
              >
                🏠 Volver al Editor
              </InternalLink>
            </div>
          </Alert>
        </div>
        <PopStyles />
      </div>
    );
  }

  return (
    <div className="min-h-full relative overflow-auto">
      <div className="absolute inset-0">
        <PopArtWallpaper />
      </div>
      <div className="relative z-10 min-h-full p-4 md:p-8">
        <div className="max-w-7xl mx-auto bg-white card-pop flex flex-col">
          <FurretHeader />
          
          {/* Navigation breadcrumbs */}
          <div className="bg-secondary-soft p-6 flex flex-wrap items-center font-comic border-b-4 border-black">
            <InternalLink href="furrettoday" className="text-secondary hover:underline text-pop-lg pop-focus">
              🏠 Inicio
            </InternalLink>
            <span className="mx-3 text-pop-lg font-bold"> ⚡ </span>
            <InternalLink href="furrettoday/editar" className="text-secondary hover:underline text-pop-lg pop-focus">
              📝 Editor
            </InternalLink>
            <span className="mx-3 text-pop-lg font-bold"> ⚡ </span>
            <span className="font-bold text-pink-500 text-pop-lg pop-shadow">✏️ {article.title}</span>
          </div>
          
          {/* Editor area */}
          <div className="flex-grow p-6">
            <div className="h-[70vh] border-8 border-dotted border-secondary rounded-3xl bg-white relative overflow-hidden">
              {/* Comic-style corner decoration */}
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-300 border-3 border-black rounded-full flex items-center justify-center transform rotate-12 z-10">
                <span className="text-black font-bold text-pop-lg">✨</span>
              </div>
              
              <CustomEditor
                document={article}
                documentId={id}
                documentType={1}
                type='news'
                token={token}
              />
            </div>
          </div>
          
          {/* Bottom decoration */}
          <div className="h-12 bg-yellow-300 border-t-4 border-black relative overflow-hidden">
            <div className="absolute inset-0 ben-day-dots"></div>
            <div className="relative z-10 flex justify-center items-center h-full">
              <span className="text-secondary-active font-bold text-pop-base pop-shadow">📝 EDITOR INDIVIDUAL FURRET TODAY 📝</span>
            </div>
          </div>
          
          <FurretFooter />
        </div>
      </div>
      <PopStyles />
    </div>
  );
}


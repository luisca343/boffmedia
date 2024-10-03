"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { Bell, LogOut, LogIn } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useBoffSession } from "@/services/useBoffSession";
import { signOut } from "next-auth/react";

const HIDDEN_APPS = ["smartrotom", "battlesim"];
const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/herramientas", label: "Herramientas" },
  { href: "/wingull", label: "Pixelmon Wingull" },
  { href: "/smartrotom", label: "SmartRotom" },
];

export function FicusNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const { session } = useBoffSession();

  const {
    notifications,
    clear,
    markAllAsRead,
    markAsRead,
    remove,
    unreadCount,
  } = useNotificationCenter();

  useEffect(() => {
    const app = pathname.split("/")[1] || "boffmedia";
    setCurrentApp(app || null);
  }, [pathname]);

  if (!currentApp || HIDDEN_APPS.includes(currentApp)) {
    return null;
  }

  function inPage(href: string) {
    return (pathname.startsWith(href) && href !== "/") || pathname === href;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <nav
      className="bg-gray-900 p-4 shadow-lg"
      aria-label="Navegación Principal"
    >
      <div className="container mx-auto flex justify-between items-center">
        <ul className="flex flex-wrap justify-start items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`text-orange-300 hover:text-orange-100 transition-colors duration-200 ease-in-out relative group flex items-center ${
                  inPage(href) ? "font-medium" : ""
                }`}
              >
                <span className="relative z-10">{label}</span>
                <span
                  className={`absolute left-0 right-0 bottom-0 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 transform ${
                    inPage(href) ? "scale-x-100" : "scale-x-0"
                  } group-hover:scale-x-100 transition-transform duration-200 ease-in-out`}
                  aria-hidden="true"
                ></span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="relative hover:bg-gray-800 transition-colors duration-200">
                <Bell className="h-5 w-5 text-orange-300" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-800 border-gray-700 text-orange-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">Notificaciones</h3>
                <Button variant="ghost" size="sm" onClick={() => clear()}>
                  Limpiar todo
                </Button>
              </div>
              <ScrollArea className="h-64">
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">
                    No hay notificaciones
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="mb-2 p-2 bg-gray-700 rounded"
                    >
                      <p className="text-sm">{notification.content}</p>
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(notification.id)}
                        >
                          Eliminar
                        </Button>
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Marcar como leído
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
          {session ? (
            <>
              <span className="text-orange-300">
                {session.user.username || session.user.smartRotomUser.username}
              </span>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-orange-300 hover:text-orange-200 hover:bg-gray-800 transition-colors duration-200"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Cerrar sesión
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              onClick={() => router.push("/auth")}
              className="text-orange-300 hover:text-orange-200 hover:bg-gray-800 transition-colors duration-200"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Iniciar sesión
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
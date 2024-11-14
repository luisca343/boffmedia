
"use client"
import { isMinecraft } from "@/services/mcef/mcefHelper";
import { useBoffSession } from "@/services/useBoffSession";
import { useThemeStore } from "@/stores/themeStore";
import { signIn, signOut } from "next-auth/react";

const themes = {
    light:{
      '--test': 'red'
    },
    dark:{
      '--test': 'blue'
    },
  }
  

export function SettingsPage(){
    const { session } = useBoffSession();
    const {theme: theme, setTheme: setTheme} = useThemeStore();

    return (
        <div>
            <div className={`flex flex-col p-2 bg-primary text-text-primary ${theme}`}>
                <button onClick={() => setTheme('theme-dark')}  className="block w-full text-left">Oscuro</button>
                <button onClick={() => setTheme('theme-light')} className="block w-full text-left">Claro</button>
                <button onClick={() => setTheme('theme-tulipan')} className="block w-full text-left">Tulipán</button>
                <button onClick={() => setTheme('theme-mizu')} className="block w-full text-left">Mizu</button>
                <button onClick={() => setTheme('theme-oasis')} className="block w-full text-left">Oasis</button>
            </div>
            <button className="text-text-primary mx-1 bg-background" onClick={() => signIn('boffmedia')}>Sign in</button>
            <button className="text-text-primary mx-1 bg-background" onClick={() => signOut()}>Sign out</button>
            <h1>Settings</h1>
            <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>
    );
}
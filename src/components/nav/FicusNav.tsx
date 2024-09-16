"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import RotomNav from './RotomNav'
import { signIn, signOut } from "next-auth/react";
import { getValidSubdomain } from '@/lib/subdomain';
import { headers } from 'next/headers'
import { useEffect, useState } from 'react';


const hide = ['smartrotom', 'battlesim', 'wingull']
export function FicusNav() {
  const pathname = usePathname()
  const [app, setApp] = useState('noApp');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApp(pathname.split('/')[1].split('/')[0]);
    }
  }, [pathname]);

  for(let h of hide){
      if(h == app) return null
  }

  if(app === 'noApp') return null
  //if (hide.includes(app)) return null
  return (
    <nav className="bg-main-900 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <Link href="/wingull" className="text-main-50 mx-2">
            Pixelmon Wingull
          </Link>
          <Link href="/smartrotom" className="text-main-50 mx-2">
            SmartRotom
          </Link>
        </div>
      </div>
    </nav>
  )
}
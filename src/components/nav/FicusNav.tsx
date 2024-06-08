"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import RotomNav from './RotomNav'
import { signIn, signOut } from "next-auth/react";
import { getValidSubdomain } from '@/lib/subdomain';
import { headers } from 'next/headers'


const hide = ['smartrotom', 'battlesim', 'wingull']
export function FicusNav() {
  const pathname = usePathname()
  let app = pathname.split('/')[1].split('/')[0]

  for(let h of hide){
      if(typeof window === 'undefined' || window.location.hostname.includes(h) || h == app) return null
  }
  //if (hide.includes(app)) return null
  return (
    <nav className="bg-blue-500 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <button className="text-white mx-1" onClick={() => signIn('google')}>Sign in</button>
        <button className="text-white mx-1" onClick={() => signOut()}>Sign out</button>
        <Link href="/" className="text-white text-lg font-bold">
          Logo
        </Link>
        <div>
          <Link href="/wingull" className="text-white mx-2">
            Pixelmon Wingull
          </Link>
          <Link href="/smartrotom" className="text-white mx-2">
            SmartRotom
          </Link>
        </div>
      </div>
    </nav>
  )
}
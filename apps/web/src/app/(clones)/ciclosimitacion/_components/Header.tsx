"use client"
import { useState } from 'react'
import { Menu, MoreVertical, Scale, Cog, LogOut, Accessibility, Inbox } from 'lucide-react'
import { ASSET, staticAsset } from '@/lib/assets'

export function Header() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <header className="fixed top-[42px] left-0 right-0 z-40 bg-white border-b border-edge h-14 flex items-center justify-between px-0">
      <div id="app_nome" className="w-60 flex items-center justify-between pl-4 border-r border-edge pr-4 h-full">
        <span className="font-bold whitespace-nowrap overflow-hidden">
          <span className="text-[#009ee0]">Ciclos</span>
          <span className="text-[#346ea1]">Imitación</span>
        </span>
        {isSidebarCollapsed ? (
          <MoreVertical className="text-[#009ee0] cursor-pointer" onClick={toggleSidebar} />
        ) : (
          <Menu className="text-[#009ee0] cursor-pointer" onClick={toggleSidebar} />
        )}
      </div>
      <div className="flex items-center space-x-4 pr-4">
        <Accessibility className="text-[#009ee0]" />
        <Scale className="text-[#009ee0]" />
        <Cog className="text-[#009ee0]" />
        <Inbox className="text-[#009ee0]" />
        <div className="flex items-center">
          <img src={staticAsset(ASSET.smartrotom.img, 'apps/chatapp/default.webp')} alt="User" className="w-8 h-8 rounded-full mr-2" />
          <span>Usuario Ejemplo</span>
        </div>
        <LogOut className="text-[#009ee0]" />
      </div>
    </header>
  )
}
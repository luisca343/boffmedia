import { Settings } from 'lucide-react'
import { env } from '@/config/env.public'

export function TopBar() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#109A0F] text-white text-[1.05em] leading-[38px] pl-[12.66667px] shadow-[-8px_-1px_8px_0_rgba(0,0,0,0.6)] h-[42px] flex items-center justify-between px-4">
      <div></div>
      <span className="flex items-center [text-shadow:_-1px_-1px_#770000]">
        <Settings className="mr-2 text-[1.26em]" />
        {env.NODE_ENV.toUpperCase() || 'LOCALHOST'}
      </span>
      <div></div>
    </div>
  )
}
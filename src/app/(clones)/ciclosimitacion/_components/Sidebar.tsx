import Link from "next/link";


interface SidebarProps {
    isSidebarCollapsed: boolean;
  }
  
  export function Sidebar({ isSidebarCollapsed }: SidebarProps) {
    return (
      <div className={`divEdu-menu fixed left-0 top-[98px] bottom-0 bg-[#19242f] overflow-auto transition-all duration-300 ${isSidebarCollapsed ? 'w-0' : 'w-60'}`}>
        <ul className="edu-menu mt-2 p-0">
          <li className="text-white min-h-[40px] whitespace-nowrap overflow-hidden hover:text-[#009ee0] hover:bg-[#070b0e]">
            <Link href="/ciclosimitacion" className="block text-[0.9em] py-[11px] px-[5px] no-underline text-ellipsis overflow-hidden">
              1 Inicio
            </Link>
          </li>
          <li className="text-white min-h-[40px] whitespace-nowrap overflow-hidden hover:text-[#009ee0] hover:bg-[#070b0e]">
            <Link href="/ciclosimitacion/dbunit" className="block text-[0.9em] py-[11px] px-[5px] no-underline text-ellipsis overflow-hidden">
              2 Convertir JSON
            </Link>
          </li>
        </ul>
      </div>
    )
  }
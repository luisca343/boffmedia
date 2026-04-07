export default function MenuWrapper({children, className =''} : {children: React.ReactNode, className?: string}) {
    return (
        <div className={`relative h-full bg-cover bg-center noSelect ${className}`} style={{backgroundImage: "url('/smartrotom/img/fondoMina.avif')", fontFamily: 'Minecrafter'}}>
            {children}
        </div>
    )
}
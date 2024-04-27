export function PokedexSection({title, children, id, className=''}: {title: string, children: any, id?: string, className?: string}){
    return <section className={`flex flex-col justify-center w-[95%] 2xl:w-[90%] m-auto ${className} `} id={id}>
        <div className="text-2xl border-b-2 2xl:border-b border-white  mb-4 mt-2 text-white">{title}</div>
        {children}
    </section>
}
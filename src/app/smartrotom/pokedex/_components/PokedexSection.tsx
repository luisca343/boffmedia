import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function PokedexSection({title, children, id, className='', btn=''}: {title: string, children: any, id?: string, className?: string, btn?: any}){
    return <Collapsible defaultOpen={true} className={`flex flex-col justify-center w-[95%] 2xl:w-[90%] m-auto ${className} `} id={id}>
        <CollapsibleTrigger className="text-2xl border-b-2 2xl:border-b border-main-300  mb-4 mt-2 text-main-300 text-start">{title}
         <span className='ml-2 text-sm '>{btn}</span></CollapsibleTrigger>
        <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
}
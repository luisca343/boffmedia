"use client"

import { InternalLink } from "@/components/nav/Link"
import { strToDate } from "@/lib/utils"
import { useDocuments } from "../_hooks/useDocuments"

export function DocumentsList() {
    const {documents, createNote} = useDocuments()
    return (
        <div className="bg-main-800  ">
            <div className="flex flex-wrap justify-start">
                    <button onClick={() => createNote()} className="text-main-50 bg-main-700 p-2 rounded-lg m-2 hover:bg-main-500 w-[300px] text-center flex flex-col justify-center items-center">
                        <h2>Crear</h2>
                    </button>
                    {documents.length > 0 ? 
                    documents.map((doc: any) => {
                        return (
                            <InternalLink key={doc.uuid} href={`/notas/${doc.id}`}>
                                <div className="text-main-50 bg-main-700 p-2 rounded-lg m-2 hover:bg-main-500 w-[300px] text-center">
                                    <h2>{doc.title}</h2>
                                    <div>{strToDate(doc.updatedAt)}</div>
                                </div>
                            </InternalLink>
                        )
                    }) : <p className="text-main-50">No documents found</p>    
                }
            </div>
        </div>
    )
}   
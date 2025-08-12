"use client"
import React from "react";
import { motion, AnimatePresence } from "framer-motion";


export function FlipBook({children, id}: {children: React.ReactNode, id: string}) {
    const [currentPage, setCurrentPage] = React.useState(0);
    const pages = React.Children.toArray(children).map((content, index) => ({ content, index }));
    
const flipPage = (direction: number) => {
    setCurrentPage((prevPage) => {
        let newPage = prevPage + 2 * direction;
        if (newPage < 0) newPage = 0;
        else if (newPage > pages.length - 1) newPage = pages.length - 1;
        else if (newPage % 2 === 0 && newPage !== 0) newPage -= direction; // Ensure newPage is odd
        return newPage;
    });
};
    return (
        <div className="m-auto w-fit flex">
            <button onClick={() => flipPage(-1)}>Anterior</button>
            <div className={`w-full h-full bg-secondary-500 flex`}>
                {pages.map((page, index) => (
                    <div key={index} className={`${isActive(page.index) ? 'bg-red-600' : 'bg-yellow-600 '}`}>
                        {page.content}
                    </div>
                ))}
            </div>
            <button onClick={() => flipPage(1)}>Siguiente</button>
        </div>
    );

function isActive(index: number) {
    let pagina = index;
    if (index !== 0 && index !== pages.length - 1) {
        pagina = index % 2 === 0 ? index - 1 : index;
    }

    console.log(pagina, currentPage);
    return pagina === currentPage;
}
}



export function Page({children}: {children: React.ReactNode}) {
    return (
        <div className="w-56 h-72 border border-solid border-red-600">
            {children}
        </div>
    );
}
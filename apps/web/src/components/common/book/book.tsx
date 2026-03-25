"use client"
import React, { ForwardedRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion, AnimatePresence } from "framer-motion";
import './book.css'


export type PageFlip = {
    getPageCount: () => number ;
    
};

export function Book({children, pageColor= '', setBook}: {children?: React.ReactNode, pageColor?: string, setBook: (book: PageFlip) => void}) {
  const [page, setPage] = useState(0);
  const [pageFlip, setPageFlip] = useState<PageFlip>({getPageCount: () => 0})
  const pages = React.Children.toArray(children).map((content, index) => { 
    return { content, index }});

  if(pages.length % 2 !== 0){
      pages.splice(pages.length - 1, 0, {content: <Page book={pageFlip} number={pages.length-1} dataDensity = "soft" className = 'bg-[#fde3e3]'></Page>, index: pages.length-1});
  }
  

let style = page == 0 
  ? {transform: 'rotateY(0deg) translateX(-25%)'} 
  : page == pages.length - 1 
    ? {transform: 'rotateY(0deg) translateX(25%)'} 
    : {transform: 'rotateY(0deg) translateX(0%)'};

return (
  <motion.div 
    className="m-auto h-[95%]  w-auto aspect-[9/5] " 
    initial={{transform: 'rotateY(0deg) translateX(-25%)'}}
    animate={style}
    transition={{
      type: "spring",
      stiffness: 200,
      damping: 15
    }}
  >
    <HTMLFlipBook
      width={450} height={500} showCover={true} size="stretch" className={``}
      style = {{}} startPage={0} minWidth={0} maxWidth={0} minHeight={0} maxHeight={0} drawShadow={true} flippingTime={1000}
      usePortrait={true} startZIndex={0} autoSize={true} maxShadowOpacity={0} mobileScrollSupport={true}
      clickEventForward={true} useMouseEvents={true} swipeDistance={50} showPageCorners={false} disableFlipByClick={false}
      onFlip={(e) => onFlip(e.data)} onInit={(e) => cargar(e)}
    >
      {pages.map((page, index) => {
        return<div key={index} className={`${(page.index % 2 === 0 && index !== pages.length-1) ? `page-${index} page-right${pageColor}` : `page-left${pageColor}`}`} >
          {page.content}
        </div>
})}
    </HTMLFlipBook>
  </motion.div>
);

function getStyle(index: number){
  return {backgroundColor: 'red'}
}

  function cargar(data: {data:number, object:PageFlip}){
      if(!pageFlip) setPageFlip(data.object)
      setBook(data.object)
    }

    function onFlip(data: number){
        setPage(data)
    }

}
interface PageCoverProps {
  children: React.ReactNode;
  dataDensity?: "hard" | "soft";
  className?: string;
}


export function Page({children, dataDensity = "soft",  className = 'bg-[#fde3e3]', style, number=0, book}: 
  {children?: React.ReactNode, dataDensity?: "hard" | "soft", className?: string, style?: React.CSSProperties, number?: number, book?: PageFlip}) {

    if(!book) return <div style={{...style, position: 'relative'}} className={`h-full w-full page drop-shadow-2xl p-2 flex flex-col `} data-density={dataDensity}></div>
    return (
    <div style={{ position: 'relative'}} className={` h-full w-full page drop-shadow-2xl flex flex-col `} data-density={dataDensity}>
        <div style={{...style}} className="h-full w-full bg-cover bg-center">{children}</div>
        {dataDensity === 'soft' && <>
          <span className={`absolute bottom-2 ${number % 2 ? 'left-4' : 'right-4'}`}>
              {number}
          </span>
          <BookLink 
              className={`absolute bottom-2 ${number % 2 ? 'right-4' : 'left-4'}`}
              book={book}
              page={1}
          >
              Índice
          </BookLink>
        </>
        }
      {dataDensity === "soft" && <div className="texture-overlay"></div> }
    </div>
    );
};


export function BookLink({children, book, page, className}: {children: React.ReactNode, book: any, page: number, className?: string}){
    return (
        <button className={`hover:cursor-pointer hover:underline hover:text-surface-700 transition-colors duration-200 font-vinque ${className}`} onClick={(e) => turnPage(book, page, e)}>
            {children}
        </button>
    )
}


export function turnPage(book: any, page: number, e: any){
  console.log(`Turning page to ${page}`)
  book.flip(page)
  e.preventDefault()
  e.stopPropagation()
}


export function PageTitle({title, children}: {title: string, children?: React.ReactNode}){
  return <div className="text-2xl 2xl:text-4xl font-bold 2xl:m-2 font-vinque underline pl-4 pt-2">{title}</div>
}
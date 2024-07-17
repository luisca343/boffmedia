"use client"
import React, { ForwardedRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { motion, AnimatePresence } from "framer-motion";
import './book.css'


type PageFlip = {
    getPageCount: () => number ;
    
};

export function Book({children, pageColor= '', setBook}: {children?: React.ReactNode, pageColor?: string, setBook: (book: PageFlip) => void}) {
  const [page, setPage] = useState(0);
  const [pageFlip, setPageFlip] = useState<PageFlip>({getPageCount: () => 0})
  const pages = React.Children.toArray(children).map((content, index) => { 
    return { content, index }});

    
  if(pages.length % 2 !== 0){
      pages.splice(pages.length - 1, 0, {content: <Page>Relleno</Page>, index: -2});
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
        console.log('index', index)
        console.log('pageindex', page.index)
        console.log('len',pages.length)
        console.log('page',page)
        console.log('test',page.index % 2 === 0 || index === pages.length-1)
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


export function Page({children, dataDensity = "soft",  className = 'bg-[#fde3e3]', style, number=0}: {children?: React.ReactNode, dataDensity?: "hard" | "soft", className?: string, style?: React.CSSProperties, number?: number}) {
    return (
        <div style={style} className={`h-full w-full page drop-shadow-2xl p-2 overflow-hidden ${className}`} data-density={dataDensity}>
             {children}
        </div>
    );
};

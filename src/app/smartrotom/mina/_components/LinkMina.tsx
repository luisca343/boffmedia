"use client"
import { motion } from 'framer-motion';
import Link from 'next/link';
export function LinkMina({href, children, className} : {href: string, children: any, className?: string}){
    return (
        <Link className={`text-xl xl:text-6xl ml-auto text-gray-100 text-shadow-border3 my-2 ${className}`} href={href}>
            <motion.div
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}>
                {children}
            </motion.div>
    </Link>
)}


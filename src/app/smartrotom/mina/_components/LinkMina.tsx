"use client"
import { InternalLink } from '@/components/nav/Link';
import { motion } from 'framer-motion';
import Link from 'next/link';
export function LinkMina({href, children, className} : {href: string, children: any, className?: string}){
    return (
        <InternalLink className={`text-xl xl:text-6xl ml-auto text-text-primary text-shadow-border3 my-2 ${className}`} href={href}>
            <motion.div
                whileHover={{scale: 1.1}}
                whileTap={{scale: 0.9}}>
                {children}
            </motion.div>
    </InternalLink>
)}


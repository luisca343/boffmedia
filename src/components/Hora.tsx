"use client"
import { useEffect, useState } from "react";

export function Hora({className= ''}: {className?: string}) {
    const getTime = (separator = ':') => {
        const date = new Date();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}${separator}${minutes}`;
    };

    const [time, setTime] = useState(getTime());

    useEffect(() => {
        const interval = setInterval(() => {
            const separator = new Date().getSeconds() % 2 === 0 ? ':' : ' ';
            setTime(getTime(separator));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return <div className={className}>{time}</div>
};
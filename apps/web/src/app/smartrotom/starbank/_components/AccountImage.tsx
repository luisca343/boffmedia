import React, { useState, useEffect } from 'react';

export function AccountImage({type, name, image, width=48, height=48}: {type?: string, name?: string, image?: string, width?: number, height?: number}) {
    const [imageExists, setImageExists] = useState(false);
    const src = getImageURL(type, name, image);
    
    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setImageExists(true);
        img.onerror = () => setImageExists(false);
    }, [src]);

    if (!imageExists) {
        return <img width={width} height={height} src="/smartrotom/img/apps/starbank/cuentas/teras.png" alt={name} className="rounded-full" />;
    }

    return (
        <img width={width} height={height} src={src} alt={name} className="rounded-full " />
    );
}

function getImageURL(type?: string, name?: string, image?: string) {
    if (type === "SECONDARY") {
        // Use the image URL if provided, otherwise fall back to the old path
        return image || `/smartrotom/img/apps/starbank/cuentas/${name!.toLowerCase()}.png`;
    } else {
        return `https://minotar.net/avatar/${name}/80.png`;
    }
}
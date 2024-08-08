export function getViewportWidth() {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
}

export function getOffset(position: string) {
    const canvasWidth = getViewportWidth() > 960 ? 960 : getViewportWidth();
    switch(position) {
        case "p1a": return {
            top: canvasWidth * .18,
            left: canvasWidth * .22,
        }

        case "p1b": return {
            top: canvasWidth * .18  + getImageSize() * .15 ,
            left: canvasWidth * .22 + getImageSize() * .75
        }

        case "p2b": return {
            top: canvasWidth * .05,
            left: canvasWidth * .45,
        }

        case "p2a": return {
            top: canvasWidth * .05 + getImageSize() * .15,
            left: canvasWidth * .05 + getImageSize() * 2.75,
        }

        default: return {
            top: 0,
            left: 0,
            x: 0,
            y: 0
        }

    }
}

export function getImageSize() {
    return getViewportWidth() >= 960 ? 175 : getViewportWidth() / 960 * 175;
}
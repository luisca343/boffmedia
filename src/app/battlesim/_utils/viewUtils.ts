export function getViewportWidth() {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
}

export function getOffset(position: string) {
    const canvasWidth = getViewportWidth() > 960 ? 960 : getViewportWidth();
    const canvasHeight = canvasWidth * 0.625;

    switch(position) {
        case "p1a": return {
            top: canvasHeight * .2 + getImageSize() * .1,
            left: canvasWidth * .2,
        }

        case "p1b": return {
            top: canvasHeight * .25  + getImageSize() * .3 ,
            left: canvasWidth * .125 + getImageSize() * .75
        }

        case "p1c": return {
            top: canvasHeight * .2 + getImageSize() * .45,
            left: canvasWidth * .1 + getImageSize() * 1.50
        }


        case "p2c": return {
            top: canvasHeight * .04 + getImageSize() * .075,
            left: canvasWidth * .42 + getImageSize() * .1
        }

        case "p2b": return {
            top: canvasHeight * .04 + getImageSize() * .075,
            left: canvasWidth * .42 + getImageSize() * .50,
        }

        case "p2a": return {
            top: canvasHeight * .04 + getImageSize() * .15,
            left: canvasWidth * .42 + getImageSize() * 1,
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
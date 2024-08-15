// Las medidas están hechas en base a 960px de ancho, por lo que se necesita saber el ancho de la ventana para ajustar las medidas.
// NO CAMBIAR
export const SCALE_WIDTH = 960;
import { Battle } from "@pkmn/client";

export const CURRENT_WIDTH = 960;
export const ASPECT_RATIO = 0.5625;

type Position = {
    top: number;
    left: number;
    x?: number;
    y?: number;
};

export function getViewportWidth() {
    if (typeof window === 'undefined') return 0;
    return window.innerWidth;
}

export function getOffset(battle: Battle, position: string, scaleMulti:number = 1) {
    const canvasWidth = getViewportWidth() > CURRENT_WIDTH ? CURRENT_WIDTH : getViewportWidth();
    const canvasHeight = canvasWidth * 0.625;

    //const gameType = battle.gameType.toString().trim().toLowerCase();
    const gameType = 'doubles';

    const positions: { [key: string]: { [key: string]: Position } } = {
        singles: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 250 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 75 * scaleMulti - getImageSize() / 2, left: 450 * scaleMulti + getImageSize() / 2 }
        },
        doubles: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 200 * scaleMulti + getImageSize() / 2 },
            p1b: { top: 250 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 75 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 },
            p2b: { top: 85 * scaleMulti - getImageSize() / 2, left: 475 * scaleMulti + + getImageSize() / 2 }
        },
        triples: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 100 * scaleMulti + getImageSize() / 2 },
            p1b: { top: 200 * scaleMulti - getImageSize() / 2, left: 275 * scaleMulti + getImageSize() / 2 },
            p1c: { top: 275 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 75 * scaleMulti - getImageSize() / 2, left: 350 * scaleMulti + getImageSize() / 2 },
            p2b: { top: 100 * scaleMulti - getImageSize() / 2, left: 400 * scaleMulti + getImageSize() / 2 },
            p2c: { top: 85 * scaleMulti - getImageSize() / 2, left: 480 * scaleMulti + getImageSize() / 2 },
        },
        triplesold: {
            p1a: { top: canvasHeight * .2 + getImageSize() * .1, left: canvasWidth * .2 },
            p1b: { top: canvasHeight * .25 + getImageSize() * .3, left: canvasWidth * .125 + getImageSize() * .75 },
            p1c: { top: canvasHeight * .2 + getImageSize() * .45, left: canvasWidth * .1 + getImageSize() * 1.50 },
            p2a: { top: getImageSize() * .4, left: canvasWidth * .4 + getImageSize() * .9 },
            p2b: { top: getImageSize() * .2, left: canvasWidth * .4 + getImageSize() * .66 },
            p2c: { top: getImageSize() * .25, left: canvasWidth * .4 + getImageSize() * .1 }
        },
        raid: {
            // 4v1
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 150 * scaleMulti + getImageSize() / 2 },
            p1b: { top: 225 * scaleMulti - getImageSize() / 2, left: 240 * scaleMulti + getImageSize() / 2 },
            p1c: { top: 250 * scaleMulti - getImageSize() / 2, left: 330 * scaleMulti + getImageSize() / 2 },
            p1d: { top: 275 * scaleMulti - getImageSize() / 2, left: 420 * scaleMulti + getImageSize() / 2 },

            p2a: { top: 120 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 }
        },
        horde: {
            // 1v5
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 250 * scaleMulti + getImageSize() / 2 },

            p2a: { top: 85 * scaleMulti - getImageSize() / 2, left: 300 * scaleMulti + getImageSize() / 2 },
            p2b: { top: 75 * scaleMulti - getImageSize() / 2, left: 350 * scaleMulti + getImageSize() / 2 },
            p2c: { top: 100 * scaleMulti - getImageSize() / 2, left: 400 * scaleMulti + getImageSize() / 2 },
            p2d: { top: 85 * scaleMulti - getImageSize() / 2, left: 450 * scaleMulti + getImageSize() / 2 },
            p2e: { top: 115 * scaleMulti - getImageSize() / 2, left: 500 * scaleMulti + getImageSize() / 2 },
        }
    };
    return positions[gameType]?.[position] || { top: 2000, left: 0, x: 0, y: 0 };
}




/*
export function getOffset(battle: Battle, position: string, multiplier?: number) {
    const canvasWidth = getViewportWidth() > CURRENT_WIDTH ? CURRENT_WIDTH : getViewportWidth();
    const canvasHeight = canvasWidth * 0.625;

    //const gameType = battle.gameType.toString().trim().toLowerCase();
    const gameType = 'doubles';

    const positions: { [key: string]: { [key: string]: Position } } = {
        singles: {
            p1a: { top: canvasHeight * .25 , left: canvasWidth * .25 + getImageSize() * .5 },
            p2a: { top: getImageSize() * .1, left: canvasWidth * .45 + getImageSize() * .5 }
        },
        doubles: {
            p1a: { top: canvasHeight * .1 + getImageSize() * .5 , left: canvasWidth * .2 + getImageSize() * .5 },
            p1b: { top: canvasHeight * .2 + getImageSize() * .5 , left: canvasWidth * .4 + getImageSize() * .5 },
            p2a: { top: getImageSize() * .075, left: canvasWidth * .4 + getImageSize() * .5 },
            p2b: { top: getImageSize() * .125, left: canvasWidth * .5 + getImageSize() * .5 }
        },
        triples: {
            p1a: { top: canvasHeight * .25, left: canvasWidth * .1 + getImageSize() * .5 },
            p1b: { top: canvasHeight * .25, left: canvasWidth * .3 + getImageSize() * .5 },
            p1c: { top: canvasHeight * .4, left: canvasWidth * .4 + getImageSize() * .5 },
            p2a: { top: getImageSize() * .05, left: canvasWidth * .52 + getImageSize() * .5 },
            p2b: { top: getImageSize() * .1, left: canvasWidth * .45 + getImageSize() * .5 },
            p2c: { top: getImageSize() * .02, left: canvasWidth * .4 + getImageSize() * .5 },
        },
        triplesold: {
            p1a: { top: canvasHeight * .2 + getImageSize() * .1, left: canvasWidth * .2 },
            p1b: { top: canvasHeight * .25 + getImageSize() * .3, left: canvasWidth * .125 + getImageSize() * .75 },
            p1c: { top: canvasHeight * .2 + getImageSize() * .45, left: canvasWidth * .1 + getImageSize() * 1.50 },
            p2a: { top: getImageSize() * .4, left: canvasWidth * .4 + getImageSize() * .9 },
            p2b: { top: getImageSize() * .2, left: canvasWidth * .4 + getImageSize() * .66 },
            p2c: { top: getImageSize() * .25, left: canvasWidth * .4 + getImageSize() * .1 }
        },
        raid: {
            // 4v1
            p1a: { top: canvasHeight * .05 + getImageSize() * .5, left: canvasWidth * .15 + getImageSize() * .5 },
            p1b: { top: canvasHeight * .1 + getImageSize() * .5, left: canvasWidth * .25 + getImageSize() * .5 },
            p1c: { top: canvasHeight * .15 + getImageSize() * .5, left: canvasWidth * .35 + getImageSize() * .5 },
            p1d: { top: canvasHeight * .2 + getImageSize() * .5, left: canvasWidth * .45 + getImageSize() * .5 },

            p2a: { top: getImageSize() * .1, left: canvasWidth * .45 + getImageSize() * .5  }
        },
        horde: {
            // 1v5
            p1a: { top: canvasHeight * .25 + getImageSize() * .3, left: canvasWidth * .125 + getImageSize() * .75 },

            p2a: { top: getImageSize() * .05, left: canvasWidth * .3 + getImageSize() * .5 },
            p2b: { top: getImageSize() * .05, left: canvasWidth * .38 + getImageSize() * .5 },
            p2c: { top: getImageSize() * .2, left: canvasWidth * .42 + getImageSize() * .5 },
            p2d: { top: getImageSize() * .12, left: canvasWidth * .5 + getImageSize() * .5 },
            p2e: { top: getImageSize() * .25, left: canvasWidth * .58 + getImageSize() * .5 },
        }
    };
    return positions[gameType]?.[position] || { top: 0, left: 0, x: 0, y: 0 };
}*/



export function getImageSize() {
    return getCanvasWidth() / SCALE_WIDTH * 175;
}

export function getCanvasWidth() {
    return getViewportWidth() > CURRENT_WIDTH ? CURRENT_WIDTH : getViewportWidth();
}

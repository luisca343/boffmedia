// Las medidas están hechas en base a 960px de ancho, por lo que se necesita saber el ancho de la ventana para ajustar las medidas.
// NO CAMBIAR
export const SCALE_WIDTH = 960;
import { Battle } from "@pkmn/client";

export function getTargetWidth() {
  if (typeof window === 'undefined') return 1280;
  return Math.round(window.screen.width * 0.65);
}
export const ASPECT_RATIO = 0.5625;

export const positionsP1 = ["p1a", "p1b", "p1c", "p1d", "p1e"];
export const positionsP2 = ["p2a", "p2b", "p2c", "p2d", "p2e"];

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
    const gameType = battle.gameType.toString().trim().toLowerCase() || 'singles';
    //const gameType = 'doubles';

    const positions: { [key: string]: { [key: string]: Position } } = {
        singles: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 250 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 75 * scaleMulti - getImageSize() / 2, left: 450 * scaleMulti + getImageSize() / 2 }
        },
        doubles: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 200 * scaleMulti + getImageSize() / 2 },
            p1b: { top: 250 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 90 * scaleMulti - getImageSize() / 2, left: 500 * scaleMulti + + getImageSize() / 2 },
            p2b: { top: 75 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 }
        },
        triples: {
            p1a: { top: 200 * scaleMulti - getImageSize() / 2, left: 100 * scaleMulti + getImageSize() / 2 },
            p1b: { top: 200 * scaleMulti - getImageSize() / 2, left: 275 * scaleMulti + getImageSize() / 2 },
            p1c: { top: 275 * scaleMulti - getImageSize() / 2, left: 375 * scaleMulti + getImageSize() / 2 },
            p2a: { top: 85 * scaleMulti - getImageSize() / 2, left: 480 * scaleMulti + getImageSize() / 2 },
            p2b: { top: 100 * scaleMulti - getImageSize() / 2, left: 400 * scaleMulti + getImageSize() / 2 },
            p2c: { top: 75 * scaleMulti - getImageSize() / 2, left: 350 * scaleMulti + getImageSize() / 2 },
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

export function getImageSize() {
    return getCanvasWidth() / SCALE_WIDTH * 175;
}

export function getCanvasWidth() {
    if (typeof window === 'undefined') return 0;
    const viewportWidth = window.innerWidth;
    const target = getTargetWidth();
    
    const canvasWidth = viewportWidth > target ? target : viewportWidth;
    return canvasWidth;
}

export function getCanvasHeight() {
    return getCanvasWidth() * ASPECT_RATIO;
}

export function getScaleMultiplier() {
    return getCanvasWidth() / SCALE_WIDTH;
}



/*
	getCanvasWidth() {
		if (typeof window === 'undefined') return 0;
		const viewportWidth = window.innerWidth;
		
		const canvasWidth = viewportWidth > CURRENT_WIDTH ? CURRENT_WIDTH : viewportWidth;
		return canvasWidth;
	}

	getScaleMulti() {
		return this.getCanvasWidth() / SCALE_WIDTH;
	}

*/
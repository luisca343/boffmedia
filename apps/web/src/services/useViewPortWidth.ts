import { getTargetWidth } from '@/app/battlesim/_utils/viewUtils';
import { useState, useEffect } from 'react';

const useViewportWidth = () => {
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        const updateViewportWidth = () => {
            setViewportWidth(window.innerWidth);
        };

        updateViewportWidth();
        window.addEventListener('resize', updateViewportWidth);

        return () => {
            window.removeEventListener('resize', updateViewportWidth);
        };
    }, []);

    const targetW = getTargetWidth();
    const canvasWidth = viewportWidth > targetW ? targetW : viewportWidth;

    return [viewportWidth, canvasWidth];
};

export default useViewportWidth;
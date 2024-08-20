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

    return viewportWidth;
};

export default useViewportWidth;
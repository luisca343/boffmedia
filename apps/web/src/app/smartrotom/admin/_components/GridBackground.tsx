import React from 'react';

export default function GridBackground() {
  return (
    <div className="grid-background-wrapper">
      <style jsx>{`
        .grid-background-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }
        
        .grid-layer-1 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 255, 0, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.07) 1px, transparent 1px);
          background-size: 50px 50px;
          opacity: 0.9;
        }
        
        .grid-layer-2 {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: 
            linear-gradient(rgba(0, 255, 0, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 0, 0.04) 1px, transparent 1px);
          background-size: 10px 10px;
          opacity: 0.7;
        }
        
        .grid-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, transparent, rgba(0, 0, 0, 0.3));
        }
      `}</style>
      <div className="grid-layer-1"></div>
      <div className="grid-layer-2"></div>
      <div className="grid-overlay"></div>
    </div>
  );
}
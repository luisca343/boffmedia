import React from 'react';

export default function Vignette() {
  return (
    <div className="vignette-wrapper">
      <style jsx>{`
        .vignette-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 3;
        }
        
        .vignette {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, 
                                     transparent 60%, 
                                     rgba(0, 20, 0, 0.4) 100%);
          opacity: 0.8;
        }
        
        /* Add a subtle pulsing effect */
        @keyframes vignette-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.7; }
        }
        
        .vignette-pulse {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(ellipse at center, 
                                     transparent 70%, 
                                     rgba(0, 50, 0, 0.3) 100%);
          animation: vignette-pulse 8s ease-in-out infinite;
        }
      `}</style>
      <div className="vignette"></div>
      <div className="vignette-pulse"></div>
    </div>
  );
}
import React from 'react';

export default function Scanline() {
  return (
    <div className="scanline-wrapper">
      <style jsx>{`
        .scanline-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }
        
        .scanline {
          position: absolute;
          width: 100%;
          height: 4px;
          background: rgba(0, 255, 0, 0.15);
          box-shadow: 0 0 10px 2px rgba(0, 255, 0, 0.4);
          animation: scanline 8s linear infinite;
        }
        
        @keyframes scanline {
          0% {
            top: -5%;
          }
          100% {
            top: 105%;
          }
        }
      `}</style>
      <div className="scanline"></div>
    </div>
  );
}
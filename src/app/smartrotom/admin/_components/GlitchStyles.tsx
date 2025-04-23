export default function GlitchStyles(){
    return(
      <style jsx global>{`
        @keyframes glitch {
          0% {
            text-shadow: 2px 2px #00ff00, -2px -2px #0000ff;
            transform: translate(0);
          }
          25% {
            text-shadow: -2px 2px #00ff00, 2px -2px #0000ff;
            transform: translate(1px, 0);
          }
          50% {
            text-shadow: 2px -2px #00ff00, -2px 2px #0000ff;
            transform: translate(-1px, 0);
          }
          75% {
            text-shadow: -2px -2px #00ff00, 2px 2px #0000ff;
            transform: translate(1px, 0);
          }
          100% {
            text-shadow: 2px 2px #00ff00, -2px -2px #0000ff;
            transform: translate(0);
          }
        }
        
        .glitch {
          animation: glitch 5s infinite;
          position: relative;
        }
        
        @keyframes glitch-mini {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
            transform: translate(1px, 0);
          }
          51% {
            opacity: 0.9;
            transform: translate(-1px, 0);
          }
          100% {
            opacity: 1;
          }
        }
        
        .glitch-mini {
          animation: glitch-mini 2s infinite;
          position: relative;
        }
        
        .hover\\:shadow-neon:hover {
          box-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00;
        }
        
        .terminal-container {
          background-color: #000000;
          background-image: radial-gradient(rgba(0, 50, 0, 0.1) 2px, transparent 2px);
          background-size: 30px 30px;
          background-position: -19px -19px;
          position: relative;
          z-index: 10;
        }
        
        .terminal-content {
          overflow-y: auto;
          max-height: 200px;
          line-height: 1.3;
        }
        
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(0, 255, 0, 0.05) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(0, 255, 0, 0.05) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        @keyframes typing {
          from { width: 0 }
          to { width: 100% }
        }
        
        .typing-effect {
          overflow: hidden;
          white-space: nowrap;
          border-right: 2px solid #00ff00;
          animation: typing 2s steps(30, end) forwards;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .animate-blink {
          animation: blink 1s step-end infinite;
        }
        
        /* New Matrix Rain - Visible Version */
        @keyframes matrix-fall {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        
        .matrix-column {
          position: absolute;
          color: #0f0;
          font-size: 12px;
          line-height: 1;
          white-space: nowrap;
          opacity: 0.2; /* Increased from 0.05 */
          text-shadow: 0 0 4px rgba(0, 255, 0, 0.7);
          animation: matrix-fall linear infinite;
          top: 0;
          overflow: hidden;
          font-weight: bold;
        }
        
        /* Individual matrix columns with varying speeds and delays */
        .matrix-rain {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1; /* Place behind content but above background */
          opacity: 0.8; /* Adjust opacity for visibility */
        }
      `}</style>
    )
}
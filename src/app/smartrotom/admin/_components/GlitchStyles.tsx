export default function GlitchStyles(){
    return(
      <style jsx global>{`
        @keyframes glitch {
          0% {
            text-shadow: 2px 2px #00ff00, -2px -2px #0000ff;
          }
          25% {
            text-shadow: -2px 2px #00ff00, 2px -2px #0000ff;
          }
          50% {
            text-shadow: 2px -2px #00ff00, -2px 2px #0000ff;
          }
          75% {
            text-shadow: -2px -2px #00ff00, 2px 2px #0000ff;
          }
          100% {
            text-shadow: 2px 2px #00ff00, -2px -2px #0000ff;
          }
        }
        .glitch {
          animation: glitch 5s infinite;
        }
        .hover\:shadow-neon:hover {
          box-shadow: 0 0 5px #00ff00, 0 0 10px #00ff00, 0 0 15px #00ff00, 0 0 20px #00ff00;
        }
        .select-content {
          min-width: 120px;
        }
      `}</style>
    )
}
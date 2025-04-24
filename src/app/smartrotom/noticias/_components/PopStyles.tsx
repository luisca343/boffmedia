"use client"
export default function PopStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&family=Permanent+Marker&display=swap");

      /* Base Typography */
      h1, h2, h3 {
        font-family: "Bangers", cursive;
        letter-spacing: 2px;
      }

      .font-comic {
        font-family: "Comic Neue", cursive;
      }
      
      .font-marker {
        font-family: "Permanent Marker", cursive;
      }

      /* Text Effects */
      .pop-shadow {
        text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }

      .button-pop-shadow {
        text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }
      
      /* Animation effects for pop art elements */
      @keyframes pulse-pop {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      .animate-pulse-pop {
        animation: pulse-pop 2s infinite;
      }
      
      /* Comic style speech bubble */
      .speech-bubble {
        position: relative;
        background: #ffffff;
        border-radius: 0.4em;
        border: 4px solid black;
      }

      .speech-bubble:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 0;
        border: 20px solid transparent;
        border-top-color: #ffffff;
        border-bottom: 0;
        margin-left: -20px;
        margin-bottom: -20px;
      }
      
      /* Ben-Day dots pattern for backgrounds */
      .ben-day-dots {
        background-image: radial-gradient(#000 10%, transparent 11%),
        radial-gradient(#000 10%, transparent 11%);
        background-size: 10px 10px;
        background-position: 0 0, 30px 30px;
        background-repeat: repeat;
        opacity: 0.1;
      }
      
      /* Additional editor styles */
      .ck-content a {
        color: #3b82f6;
        text-decoration: underline;
      }
      
      .ck-content blockquote {
        font-family: "Permanent Marker", cursive;
        border-left: 6px solid #ec4899;
        padding-left: 1rem;
        font-style: italic;
      }
    `}</style>
  );
}
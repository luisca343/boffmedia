"use client"
export default function PopStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;600;700;800&family=Permanent+Marker&display=swap");

      /* Base Typography - Following 8pt grid system */
      h1, h2, h3 {
        font-family: "Bangers", cursive;
        letter-spacing: 1px;
        line-height: 1.2;
      }

      .font-comic {
        font-family: "Nunito", sans-serif;
        font-weight: 600;
      }
      
      .font-marker {
        font-family: "Permanent Marker", cursive;
      }

      /* Improved text effects with better contrast */
      .pop-shadow {
        text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }

      .pop-shadow-strong {
        text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }

      /* Consistent animation timing */
      @keyframes button-press {
        0% { transform: scale(1) translate(0, 0); }
        100% { transform: scale(0.98) translate(2px, 2px); }
      }

      @keyframes button-burst {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }

      @keyframes pulse-pop {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      
      .animate-pulse-pop {
        animation: pulse-pop 3s infinite ease-in-out;
      }

      .animate-button-press:active {
        animation: button-press 160ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }

      .animate-button-burst {
        animation: button-burst 240ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
      }
      
      /* Improved focus states for accessibility */
      .pop-focus:focus-visible {
        outline: 3px solid #FFD700;
        outline-offset: 2px;
        border-radius: 16px;
      }

      /* Comic style speech bubble with proper sizing */
      .speech-bubble {
        position: relative;
        background: #ffffff;
        border-radius: 16px;
        border: 3px solid black;
        padding: 16px 24px;
      }

      .speech-bubble:after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 0;
        border: 16px solid transparent;
        border-top-color: #ffffff;
        border-bottom: 0;
        margin-left: -16px;
        margin-bottom: -16px;
      }
      
      /* Improved Ben-Day dots pattern for backgrounds */
      .ben-day-dots {
        background-image: radial-gradient(circle, #000 8%, transparent 10%);
        background-size: 12px 12px;
        background-position: 0 0, 6px 6px;
        background-repeat: repeat;
        opacity: 0.08;
        pointer-events: none; /* Fix: Prevent dots from blocking clicks */
      }

      .ben-day-dots-strong {
        background-image: radial-gradient(circle, #000 10%, transparent 12%);
        background-size: 16px 16px;
        background-position: 0 0, 8px 8px;
        background-repeat: repeat;
        opacity: 0.12;
        pointer-events: none; /* Fix: Prevent dots from blocking clicks */
      }

      /* Reduce motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        .animate-pulse-pop,
        .animate-button-press,
        .animate-button-burst {
          animation: none;
        }
        
        .transition-transform {
          transition: none;
        }
      }
      
      /* Typography scale following 8pt grid */
      .text-pop-xs { font-size: 12px; line-height: 1.5; }
      .text-pop-sm { font-size: 14px; line-height: 1.5; }
      .text-pop-base { font-size: 16px; line-height: 1.5; }
      .text-pop-lg { font-size: 20px; line-height: 1.2; }
      .text-pop-xl { font-size: 24px; line-height: 1.2; }
      .text-pop-2xl { font-size: 32px; line-height: 1.2; }
      .text-pop-3xl { font-size: 48px; line-height: 1.2; }
      .text-pop-4xl { font-size: 64px; line-height: 1.2; }

      /* Improved button styles */
      .btn-pop-primary {
        background: #FFD700;
        color: #000;
        border: 3px solid #000;
        border-radius: 24px;
        padding: 12px 24px;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 8px 8px 0 0 rgba(0, 0, 0, 1);
        transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 44px;
        min-width: 44px;
      }

      .btn-pop-primary:hover {
        background: #FFF;
        box-shadow: 6px 6px 0 0 rgba(0, 0, 0, 1);
        transform: translate(2px, 2px);
      }

      .btn-pop-primary:active {
        box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
        transform: translate(4px, 4px);
      }

      .btn-pop-secondary {
        background: #FF1493;
        color: #FFF;
        border: 3px solid #000;
        border-radius: 24px;
        padding: 12px 24px;
        font-weight: 700;
        font-size: 16px;
        box-shadow: 8px 8px 0 0 rgba(0, 0, 0, 1);
        transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
        min-height: 44px;
        min-width: 44px;
      }

      .btn-pop-secondary:hover {
        background: #FF69B4;
        box-shadow: 6px 6px 0 0 rgba(0, 0, 0, 1);
        transform: translate(2px, 2px);
      }
      
      /* Editor content improvements */
      .ck-content a {
        color: #0066FF;
        text-decoration: underline;
        text-decoration-thickness: 2px;
      }
      
      .ck-content blockquote {
        font-family: "Permanent Marker", cursive;
        border-left: 6px solid #FF1493;
        padding-left: 16px;
        margin: 16px 0;
        font-style: italic;
        background: rgba(255, 20, 147, 0.05);
        border-radius: 0 16px 16px 0;
      }

      /* Card improvements */
      .card-pop {
        border: 3px solid #000;
        border-radius: 24px;
        box-shadow: 8px 8px 0 0 rgba(0, 0, 0, 1);
        transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
      }

      .card-pop:hover {
        box-shadow: 12px 12px 0 0 rgba(0, 0, 0, 1);
        transform: translate(-2px, -2px);
      }
      
      /* Checkbox button styles for news list */
      .btn-pop-checkmark {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        background: #F3F4F6;
        border: 3px solid #000;
        border-radius: 20px;
        transition: all 240ms cubic-bezier(0.4, 0, 0.2, 1);
        font-size: 14px;
        font-weight: 700;
        box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
      }
      
      .btn-pop-checkmark:hover {
        background: #E5E7EB;
        transform: translate(1px, 1px);
        box-shadow: 3px 3px 0 0 rgba(0, 0, 0, 1);
      }
      
      .btn-pop-checkmark.active {
        background: #DBEAFE;
        color: #1E40AF;
      }
      
      .btn-pop-checkmark.active.featured {
        background: #FEF3C7;
        color: #B45309;
      }
      
      /* Editor page improvements */
      
      /* Custom scrollbar for editor */
      ::-webkit-scrollbar {
        width: 12px;
      }

      ::-webkit-scrollbar-track {
        background-color: #FDE047;
        border: 2px solid #000;
        border-radius: 8px;
      }

      ::-webkit-scrollbar-thumb {
        background-color: #EC4899;
        border: 2px solid #000;
        border-radius: 8px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background-color: #BE185D;
      }
      
      /* CKEditor improvements */
      .ck.ck-editor__editable_inline {
        overflow: hidden !important;
        height: 100% !important;
        font-family: "Nunito", sans-serif !important;
        font-size: 16px !important;
        line-height: 1.6 !important;
      }
      
      /* Sidebar layout fixes */
      .editor-sidebar {
        display: flex;
        flex-direction: column;
        min-height: 100%;
      }
      
      .overflow-y-auto {
        overflow-y: auto !important;
      }
      
      .flex-grow {
        flex-grow: 1 !important;
      }
    `}</style>
  );
}
"use client"
export default function PopStyles() {
  return (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Bangers&family=Comic+Neue:wght@700&display=swap");

      h1,
      h2,
      h3 {
        font-family: "Bangers", cursive;
        letter-spacing: 2px;
      }

      .font-comic {
        font-family: "Comic Neue", cursive;
      }

      .pop-shadow {
        text-shadow: 3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }

      .button-pop-shadow {
        text-shadow: 2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000,
          -1px 1px 0 #000, 1px 1px 0 #000;
      }
    `}</style>
  );
}

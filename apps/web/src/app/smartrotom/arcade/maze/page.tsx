import BindingOfIsaacMaze from "./_components/BindingOfIsaacMaze"

// `arcade/layout.tsx` already owns the scope root, the canvas and the HUD — a game
// page never re-mounts a background of its own.
export default function MazePage() {
  return <BindingOfIsaacMaze />
}

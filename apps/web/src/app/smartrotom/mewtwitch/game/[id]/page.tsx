import { CategoryView } from "../_components/CategoryView"

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CategoryView id={id} />
}

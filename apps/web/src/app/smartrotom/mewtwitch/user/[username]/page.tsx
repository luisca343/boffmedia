import { UserView } from "../_components/UserView"

export default async function UserPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return <UserView username={username} />
}

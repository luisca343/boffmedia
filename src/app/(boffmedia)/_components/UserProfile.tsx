'use client'

import { useState } from 'react'
import BoffLayout from './BoffLayout'
import { useBoffSession } from '@/services/useBoffSession'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Gamepad2, Mail, User, LinkIcon } from 'lucide-react'

export default function UserProfile() {
  const { session } = useBoffSession()
  const user = session?.user

  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState(user || {})

  const linkDiscord = async () => {
    // Simulating Discord OAuth flow
    console.log('Linking Discord account...')
    // In a real implementation, you would redirect to Discord OAuth here
    // and handle the callback in a separate component/route
    setTimeout(() => {
      setEditedUser(prevUser => ({ ...prevUser, discordLinked: true }))
    }, 2000)
  }

  const handleSave = () => {
    // Here you would typically send the updated user data to your backend
    console.log('Saving user data:', editedUser)
    setIsEditing(false)
  }

  if (!user) {
    return (
      <BoffLayout>
        <div className="container mx-auto py-10 text-center">
          <h1 className="text-2xl font-bold mb-4">User Profile</h1>
          <p>Please log in to view your profile.</p>
        </div>
      </BoffLayout>
    )
  }

  return (
    <BoffLayout>
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user.image || '/placeholder.svg?height=100&width=100'} alt={user.username || 'User'} />
                <AvatarFallback>{user.username ? user.username.charAt(0) : 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold">{user.username || 'Anonymous User'}</h2>
                <p className="text-muted-foreground">{user.email || 'No email provided'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={editedUser.username || ''} 
                  onChange={(e) => setEditedUser(prev => ({ ...prev, name: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={editedUser.email || ''} 
                  onChange={(e) => setEditedUser(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Gamepad2 className="text-muted-foreground" />
              <span>Discord Account:</span>
              {editedUser.discordLinked ? (
                <Badge variant="outline" className="ml-2">Linked</Badge>
              ) : (
                <Button onClick={linkDiscord} variant="outline" size="sm" className="ml-2">
                  <LinkIcon className="mr-2 h-4 w-4" /> Link Discord
                </Button>
              )}
            </div>

            {isEditing ? (
              <div className="flex space-x-2">
                <Button onClick={handleSave} className="flex-1">Save Changes</Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)} className="w-full">Edit Profile</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </BoffLayout>
  )
}
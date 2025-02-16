"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Gamepad2, LinkIcon, Loader2 } from 'lucide-react';
import useSocketStore from "@/stores/useSocketStore";
import { useBoffSession } from "@/services/useBoffSession";
import { uploadService } from "@/services/api/smartrotom/uploadService";

export default function UserProfile() {
  const { session } = useBoffSession();
  const socket = useSocketStore((state) => state.socket);
  const user = session?.user;

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user || {});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditedUser(user);
    }
  }, [user]);

  const linkDiscord = async () => {
    console.log("Linking Discord account...");
    setTimeout(() => {
      setEditedUser((prevUser) => ({ ...prevUser, discordLinked: true }));
    }, 2000);
  };

  const handleSave = () => {
    console.log("Saving user data:", editedUser);
    setIsEditing(false);
  };

  const handleImageClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const response = await uploadService.uploadProfileImage(file, user?.id || 'default');

      console.log("Upload response:", response);
      
      if (response.data) {
        setEditedUser(prev => ({
          ...prev,
          image: response.data!.url
        }));
      } else {
        setUploadError('Upload failed: No response data');
      }
    } catch (err) {
      setUploadError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">User Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
              <Avatar className="w-20 h-20 relative">
                <AvatarImage
                  src={`/uploads/profiles/${editedUser.id || '0'}.jpg` || "/placeholder.svg?height=100&width=100"}
                  alt={editedUser.name || "User"}
                />
                <AvatarFallback>
                  {editedUser.name ? editedUser.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
                
                {/* Upload overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>

                {/* Loading overlay */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </Avatar>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div>
              <h2 className="text-2xl font-semibold">
                {editedUser.name || "Anonymous User"}
              </h2>
              <p className="text-muted-foreground">
                {editedUser.email || "No email provided"}
              </p>
              {uploadError && (
                <p className="text-sm text-destructive mt-1">
                  {uploadError}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editedUser.name || ""}
                onChange={(e) =>
                  setEditedUser((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedUser.email || ""}
                onChange={(e) =>
                  setEditedUser((prev) => ({ ...prev, email: e.target.value }))
                }
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Gamepad2 className="text-muted-foreground" />
            <span>Discord Account:</span>
            {editedUser.discordId ? (
              <Badge variant="outline" className="ml-2">
                Linked
              </Badge>
            ) : (
              <Button
                onClick={linkDiscord}
                variant="outline"
                size="sm"
                className="ml-2"
              >
                <LinkIcon className="mr-2 h-4 w-4" /> Link Discord
              </Button>
            )}
          </div>

          <div>
            Roles: {user.roles?.join(", ") || "No roles assigned"}
          </div>

          <div>
            Socket: {socket ? socket.id : "Not connected"}
          </div>

          {isEditing ? (
            <div className="flex space-x-2">
              <Button onClick={handleSave} className="flex-1">
                Save Changes
              </Button>
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Profile
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
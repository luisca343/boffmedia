"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Camera, Gamepad2, LinkIcon, Loader2, User, Mail, Shield, Wifi } from 'lucide-react';
import useSocketStore from "@/stores/useSocketStore";
import { useBoffSession } from "@/services/useBoffSession";
import { UploadService } from "@/services/api/smartrotom/uploadService";
import { FloatingBackground } from "./layout/FloatingBackground";

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
      const response = await UploadService.uploadProfileImage(file, user?.id || 'default');

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
      <div className="relative min-h-screen bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden">
        <FloatingBackground variant="cool" />
        <div className="relative container mx-auto px-4 py-24 text-center z-10">
          <div className="max-w-md mx-auto bg-gradient-to-br from-surface-800 to-surface-900 border border-surface-700 rounded-2xl p-8 shadow-2xl">
            <User className="h-16 w-16 text-primary-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">
              User Profile
            </h1>
            <p className="text-surface-300">Please log in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 overflow-hidden">
      <FloatingBackground variant="warm" />
      
      <div className="relative container mx-auto px-4 py-24 z-10">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-surface-800 to-surface-900 border-surface-700 transition-all duration-500 shadow-2xl">
          <CardContent className="space-y-8 p-8">
            {/* Profile Picture and Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group cursor-pointer" onClick={handleImageClick}>
                  <Avatar className="w-32 h-32 relative border-4 border-gradient-to-r from-primary-500 to-orange-500">
                    <AvatarImage
                      src={`/uploads/profiles/${editedUser.id || '0'}.jpg` || "/placeholder.svg?height=128&width=128"}
                      alt={editedUser.name || "User"}
                      className="object-cover"
                    />
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-primary-500 to-orange-500 text-white">
                      {editedUser.name ? editedUser.name.charAt(0).toUpperCase() : "U"}
                    </AvatarFallback>
                    
                    {/* Upload overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-white" />
                    </div>

                    {/* Loading overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-70 rounded-full flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
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
                
                {uploadError && (
                  <p className="text-sm text-error-500 bg-error-950/50 px-3 py-1 rounded-md border border-error-800">
                    {uploadError}
                  </p>
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-orange-400">
                  {editedUser.name || "Anonymous User"}
                </h2>
                <p className="text-xl text-surface-300 mb-4">
                  {editedUser.email || "No email provided"}
                </p>
                
                {/* Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <Card className="bg-gradient-to-br from-surface-700 to-surface-800 border-surface-600">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Shield className="h-6 w-6 text-primary-500" />
                      <div>
                        <p className="text-sm text-surface-400">Roles</p>
                        <p className="font-medium text-surface-100">
                          {user.roles?.join(", ") || "No roles"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gradient-to-br from-surface-700 to-surface-800 border-surface-600">
                    <CardContent className="p-4 flex items-center space-x-3">
                      <Wifi className="h-6 w-6 text-success-500" />
                      <div>
                        <p className="text-sm text-surface-400">Connection</p>
                        <p className="font-medium text-surface-100">
                          {socket ? "Connected" : "Disconnected"}
                        </p>
                        
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-surface-200 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  id="name"
                  value={editedUser.name || ""}
                  onChange={(e) =>
                    setEditedUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={!isEditing}
                  className="bg-surface-700 border-surface-600 text-surface-100 disabled:opacity-60 focus:border-primary-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-surface-200 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={editedUser.email || ""}
                  onChange={(e) =>
                    setEditedUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={!isEditing}
                  className="bg-surface-700 border-surface-600 text-surface-100 disabled:opacity-60 focus:border-primary-500"
                />
              </div>
            </div>

            {/* Discord Integration */}
            <Card className="bg-gradient-to-br from-surface-700 to-surface-800 border-surface-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-primary-500 to-orange-500">
                      <Gamepad2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-100">Discord Account</h3>
                      <p className="text-surface-400">Connect your Discord account for enhanced features</p>
                    </div>
                  </div>
                  <div>
                    {editedUser.discordId ? (
                      <Badge className="bg-success-500/20 text-success-400 border-success-500/30">
                        <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                        Linked
                      </Badge>
                    ) : (
                      <Button
                        onClick={linkDiscord}
                        variant="outline"
                        className="border-primary-500 text-primary-400 hover:bg-primary-500/10"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link Discord
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            

            {/* Minecraft Integration */}
            <Card className="bg-gradient-to-br from-surface-700 to-surface-800 border-surface-600">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-surface-100">Minecraft Account</h3>
                      <p className="text-surface-400">Link your Minecraft account to access servers</p>
                    </div>
                  </div>
                  <div>
                    {(user.mcUuid || user.smartRotomUser?.uuid) ? (
                      <Badge className="bg-success-500/20 text-success-400 border-success-500/30">
                        <span className="w-2 h-2 bg-success-500 rounded-full mr-2"></span>
                        Linked
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-green-500 text-green-400 hover:bg-green-500/10"
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        Link Minecraft
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-surface-700">
              {isEditing ? (
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    onClick={handleSave} 
                    className="flex-1 bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setIsEditing(false)}
                    variant="outline"
                    className="flex-1 border-surface-600 text-surface-300 hover:bg-surface-700"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={() => setIsEditing(true)} 
                  className="w-full bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
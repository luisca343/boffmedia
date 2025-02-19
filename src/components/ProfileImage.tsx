import Image from 'next/image'
import { useState, useEffect } from 'react'

export function ProfileImage({ userId, size }: { userId: number , size?: number}) {
    const [imageExists, setImageExists] = useState(() => {
        const cached = localStorage.getItem(`profile-image-${userId}`)
        return cached ? JSON.parse(cached) : false
    })
    const imagePath = `/uploads/profiles/${userId}.jpg`
    
    useEffect(() => {
        const cacheKey = `profile-image-${userId}`
        const cached = localStorage.getItem(cacheKey)
        
        // Only check if not cached
        if (!cached) {
            const checkImage = async () => {
                try {
                    const response = await fetch(imagePath)
                    const exists = response.ok
                    setImageExists(exists)
                    localStorage.setItem(cacheKey, JSON.stringify(exists))
                } catch (error) {
                    setImageExists(false)
                    localStorage.setItem(cacheKey, 'false')
                }
            }
            
            checkImage()
        }
    }, [userId, imagePath])

    return (
        <Image 
            src={imageExists ? imagePath : '/profile.png'} 
            alt="profile"
            className="rounded-full object-cover"
            width={size || 40}
            height={size || 40}
        />
    )
}
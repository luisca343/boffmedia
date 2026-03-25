import Image from 'next/image'
import { useState } from 'react'

export function ProfileImage({ userId, size }: { userId: number, size?: number }) {
    const [errored, setErrored] = useState(false)
    const imagePath = `/uploads/profiles/${userId}.jpg`
    const dimension = size || 48

    return (
        <div
            style={{ width: dimension, height: dimension }}
            className="rounded-full overflow-hidden aspect-square flex items-center justify-center bg-surface-700"
        >
            <Image
                src={errored ? '/profile.png' : imagePath}
                alt="profile"
                className="w-full h-full object-cover rounded-full"
                width={dimension}
                height={dimension}
                onError={() => setErrored(true)}
                unoptimized
            />
        </div>
    )
}
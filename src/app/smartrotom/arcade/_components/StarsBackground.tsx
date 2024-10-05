"use client"

import React, { useState, useEffect } from 'react'

interface Star {
  x: number
  y: number
  size: number
}

export default function StarsBackground() {
  const [stars, setStars] = useState<Star[]>([])

  useEffect(() => {
    const newStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
    }))
    setStars(newStars)
  }, [])

  return (
    <>
      {stars.map((star, index) => (
        <div
          key={index}
          className="absolute bg-white rounded-full animate-twinkle"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </>
  )
}
'use client'

import React from 'react'
import TreeNode from './TreeNode'

interface FileTreeProps {
  structure: Record<string, any>
}

export default function FileTree({ structure }: FileTreeProps) {
  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
        Explorador de Herramientas
      </h2>
      <div className="space-y-2">
        {Object.entries(structure).map(([key, value]) => (
          <TreeNode key={key} name={key} structure={value} path="/herramientas" />
        ))}
      </div>
    </div>
  )
}
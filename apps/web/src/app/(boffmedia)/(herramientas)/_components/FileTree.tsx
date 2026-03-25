'use client'

import React from 'react'
import TreeNode from './TreeNode'

interface FileTreeProps {
  structure: Record<string, any>
}

export default function FileTree({ structure }: FileTreeProps) {
  return (
    <div className="p-6 bg-surface-900 rounded-lg border border-primary-700 shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-primary-600">
        Explorador de Herramientas
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(structure).map(([key, value]) => (
          <TreeNode key={key} name={key} structure={value} path="/herramientas" />
        ))}
      </div>
    </div>
  )
}
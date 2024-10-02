'use client'

import React from 'react'
import TreeNode from './TreeNode'

interface FileTreeProps {
  structure: Record<string, any>
}

export default function FileTree({ structure }: FileTreeProps) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg ">
      <div className="space-y-2">
        {Object.entries(structure).map(([key, value]) => (
          <TreeNode key={key} name={key} structure={value} path="/tools" />
        ))}
      </div>
    </div>
  )
}
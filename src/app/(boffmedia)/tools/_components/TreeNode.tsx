'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'
import { firstToUpper } from '@/lib/utils'

interface TreeNodeProps {
  name: string
  structure: Record<string, any> | string
  path: string
}

export default function TreeNode({ name, structure, path }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(true)
  const isDirectory = typeof structure === 'object'
  const fullPath = `${path}/${name}`

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <div className="py-1">
      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-700 transition-colors duration-150">
        {isDirectory && (
          <button onClick={toggleOpen} className="focus:outline-none">
            {isOpen ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-white" />}
          </button>
        )}
        {isDirectory ? (
          <Folder className="w-5 h-5 text-yellow-500" />
        ) : (
          <File className="w-5 h-5 text-blue-300" />
        )}
        {!isDirectory ? (
          <Link href={fullPath} className="text-blue-400 hover:underline font-medium">
            {structure}
          </Link>
        ) : (
          <span className="font-medium text-gray-200">{firstToUpper(name)}</span>
        )}
      </div>
      {isDirectory && isOpen && (
        <div className="pl-6 mt-1 border-l-2 border-gray-200">
          {Object.entries(structure).map(([key, value]) => (
            <TreeNode key={key} name={key} structure={value} path={fullPath} />
          ))}
        </div>
      )}
    </div>
  )
}
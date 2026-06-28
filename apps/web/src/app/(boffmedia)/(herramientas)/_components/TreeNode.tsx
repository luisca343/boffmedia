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
  const fullPath = `${path.replace("/herramientas", "")}/${name}`

  const toggleOpen = () => setIsOpen(!isOpen)

  return (
    <div className="py-1">
      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-layer-2 transition-colors duration-150">
        {isDirectory && (
          <button onClick={toggleOpen} className="focus:outline-none">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-primary-hover" />
            ) : (
              <ChevronRight className="w-4 h-4 text-primary-hover" />
            )}
          </button>
        )}
        {isDirectory ? (
          <Folder className="w-5 h-5 text-primary" />
        ) : (
          <File className="w-5 h-5 text-primary-hover" />
        )}
        {!isDirectory ? (
          <Link href={fullPath} className="text-primary-hover hover:text-primary-hover hover:underline font-medium transition-colors duration-150">
            {structure}
          </Link>
        ) : (
          <span className="font-medium text-primary-hover">{firstToUpper(name)}</span>
        )}
      </div>
      {isDirectory && isOpen && (
        <div className="ml-4 pl-4 mt-1 border-l-2 border-primary-active">
          {Object.entries(structure).map(([key, value]) => (
            <TreeNode key={key} name={key} structure={value} path={fullPath} />
          ))}
        </div>
      )}
    </div>
  )
}
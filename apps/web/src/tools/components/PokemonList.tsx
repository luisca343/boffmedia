import React, { useState, useRef, useEffect } from "react"

interface VirtualizedListProps {
  items: any[]
  itemHeight: number
  renderItem: (item: any, index: number) => React.JSX.Element
}

const VirtualizedList = ({ items, itemHeight, renderItem }: VirtualizedListProps) => {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(200 / itemHeight)

  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.addEventListener("scroll", handleScroll)
    }
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(items.length - 1, startIndex + visibleCount)

  const visibleItems = items.slice(startIndex, endIndex + 1)

  return (
    <div ref={containerRef} className="text-surface-100 overflow-y-auto" style={{ height: "200px" }}>
      <div style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${startIndex * itemHeight}px)` }}>
          {visibleItems.map((item, index) => renderItem(item, startIndex + index))}
        </div>
      </div>
    </div>
  )
}

export default VirtualizedList

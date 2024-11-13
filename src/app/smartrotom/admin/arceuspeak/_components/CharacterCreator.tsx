"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const colorCodes = [
  { name: "Negro", code: "0", textColor: "white" },
  { name: "Azul Oscuro", code: "1", textColor: "white" },
  { name: "Verde Oscuro", code: "2", textColor: "white" },
  { name: "Cyan Oscuro", code: "3", textColor: "black" },
  { name: "Rojo Oscuro", code: "4", textColor: "white" },
  { name: "Púrpura", code: "5", textColor: "white" },
  { name: "Dorado", code: "6", textColor: "black" },
  { name: "Gris", code: "7", textColor: "black" },
  { name: "Gris Oscuro", code: "8", textColor: "white" },
  { name: "Azul", code: "9", textColor: "white" },
  { name: "Verde Lima", code: "a", textColor: "black" },
  { name: "Cyan", code: "b", textColor: "black" },
  { name: "Rojo", code: "c", textColor: "white" },
  { name: "Rosa", code: "d", textColor: "black" },
  { name: "Amarillo", code: "e", textColor: "black" },
  { name: "Blanco", code: "f", textColor: "black" },
]

const textStyles = [
  { name: "Negrita", code: "l" },
  { name: "Cursiva", code: "o" },
  { name: "Subrayado", code: "n" },
  { name: "Tachado", code: "m" },
  { name: "Reset", code: "r" },
]

const formatToHtml = (format: string) => {
  return format.replace(/§([0-9a-fk-or])/g, (match, p1) => {
    switch (p1) {
      case 'l': return '<span style="font-weight: bold;">';
      case 'k': return '<span style="text-decoration: blink;">';
      case 'o': return '<span style="font-style: italic;">';
      case 'n': return '<span style="text-decoration: underline;">';
      case 'm': return '<span style="text-decoration: line-through;">';
      case 'r': return '</span>';
      default: return `<span style="color: #${p1 === '0' ? '000' : p1 === '1' ? '00A' : p1 === '2' ? '0A0' : p1 === '3' ? '0AA' : p1 === '4' ? 'A00' : p1 === '5' ? 'A0A' : p1 === '6' ? 'FA0' : p1 === '7' ? 'AAA' : p1 === '8' ? '555' : p1 === '9' ? '55F' : p1 === 'a' ? '5F5' : p1 === 'b' ? '5FF' : p1 === 'c' ? 'F55' : p1 === 'd' ? 'F5F' : p1 === 'e' ? 'FF5' : 'FFF'};">`;
    }
  });
}

export default function CharacterCreator() {
  const [characterFormat, setCharacterFormat] = useState("§l§f[§6Nombre del Personaje§f]")
  const [previewHtml, setPreviewHtml] = useState("")
  const formatInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const html = formatToHtml(characterFormat)
    setPreviewHtml(html)
  }, [characterFormat])

  const insertCode = (code: string) => {
    if (formatInputRef.current) {
      const input = formatInputRef.current
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newFormat = characterFormat.substring(0, start) + `§${code}` + characterFormat.substring(end)
      setCharacterFormat(newFormat)
      
      // Set cursor position after the inserted code
      setTimeout(() => {
        input.setSelectionRange(start + 2, start + 2)
        input.focus()
      }, 0)
    }
  }

  const createCharacter = () => {
    const newCharacter = {
      format: characterFormat
    }
    console.log(`Nuevo personaje creado:`, newCharacter)
    // Aquí iría la lógica para guardar el nuevo personaje
  }

  return (
    <div className="space-y-4">
      <Input
        ref={formatInputRef}
        placeholder="Formato (ej: §l§f[§6Nombre del Personaje§f])"
        value={characterFormat}
        onChange={(e) => setCharacterFormat(e.target.value)}
        className="bg-gray-800 text-green-400 border-green-500"
      />
      <div className="grid grid-cols-4 gap-2">
        {colorCodes.map((color) => (
          <Button
            key={color.code}
            onClick={() => insertCode(color.code)}
            className="p-1 h-8"
            style={{ 
              backgroundColor: `#${color.code === '0' ? '000' : color.code === '1' ? '00A' : color.code === '2' ? '0A0' : color.code === '3' ? '0AA' : color.code === '4' ? 'A00' : color.code === '5' ? 'A0A' : color.code === '6' ? 'FA0' : color.code === '7' ? 'AAA' : color.code === '8' ? '555' : color.code === '9' ? '55F' : color.code === 'a' ? '5F5' : color.code === 'b' ? '5FF' : color.code === 'c' ? 'F55' : color.code === 'd' ? 'F5F' : color.code === 'e' ? 'FF5' : 'FFF'}`,
              color: color.textColor
            }}
          >
            {color.name}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {textStyles.map((style) => (
          <Button
            key={style.code}
            onClick={() => insertCode(style.code)}
            className="bg-gray-700 hover:bg-gray-600 text-green-400"
          >
            {style.name}
          </Button>
        ))}
      </div>
      <div className="bg-gray-800 p-2 rounded border border-green-500">
        <p className="text-green-400">Vista previa:</p>
        <p dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
      <Button onClick={createCharacter} className="w-full bg-green-700 hover:bg-green-600 text-black">
        Crear Personaje
      </Button>
    </div>
  )
}
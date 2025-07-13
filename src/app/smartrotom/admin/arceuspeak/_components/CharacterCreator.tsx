"use client"

import { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SmartrotomService } from '@/services/api/smartrotom/smartrotomService'
import { toast } from 'react-toastify'
import { Plus, Eye, AlertTriangle, Check } from 'lucide-react'

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
  const [name, setName] = useState('')
  const [characterFormat, setCharacterFormat] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [creating, setCreating] = useState(false)
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

  const createCharacter = async () => {
    if (!name.trim() || !characterFormat.trim()) {
      toast.error('Nombre y formato son requeridos')
      return
    }
    
    setCreating(true)
    
    const newCharacter = {
      format: characterFormat,
      name: name,
      value: `${name.toLowerCase().replaceAll(' ', '_')}`
    }

    console.log(newCharacter)
    
    try {
      const res = await SmartrotomService.postArceuSpeak(newCharacter)
      if(res.statusCode === 200) {
        toast.success('Personaje creado')
        setName('')
        setCharacterFormat('')
      } else {
        toast.error('Error al crear personaje')
      }
    } catch (error) {
      toast.error('Error de conexión')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4 text-green-400">
      <div className="text-xs text-green-600 mb-1">
        <span className="text-green-600/60">{"//"} </span>
        Identificador
      </div>
      <Input
        placeholder="Nombre del Personaje"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="bg-black text-green-400 border-green-700 focus:border-green-500 focus:ring-0"
      />
      
      <div className="text-xs text-green-600 mb-1">
        <span className="text-green-600/60">{"//"} </span>
        Formato de apariencia
      </div>
      <Input
        ref={formatInputRef}
        placeholder="Formato (ej: §l§f[§6Nombre del Personaje§f])"
        value={characterFormat}
        onChange={(e) => setCharacterFormat(e.target.value)}
        className="bg-black text-green-400 border-green-700 focus:border-green-500 focus:ring-0 font-mono"
      />
      
      <div className="border-t border-green-800/30 pt-3">
        <div className="text-xs text-green-600 mb-2 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Selección de colores
        </div>
        <div className="grid grid-cols-4 gap-2">
          {colorCodes.map((color) => (
            <Button
              key={color.code}
              onClick={() => insertCode(color.code)}
              className="p-1 h-8 border border-green-900 hover:border-green-700 transition-colors relative overflow-hidden"
              style={{ 
                backgroundColor: `#${color.code === '0' ? '000' : color.code === '1' ? '00A' : color.code === '2' ? '0A0' : color.code === '3' ? '0AA' : color.code === '4' ? 'A00' : color.code === '5' ? 'A0A' : color.code === '6' ? 'FA0' : color.code === '7' ? 'AAA' : color.code === '8' ? '555' : color.code === '9' ? '55F' : color.code === 'a' ? '5F5' : color.code === 'b' ? '5FF' : color.code === 'c' ? 'F55' : color.code === 'd' ? 'F5F' : color.code === 'e' ? 'FF5' : 'FFF'}`,
                color: color.textColor
              }}
            >
              {color.name}
              <span className="absolute bottom-0 right-0 text-xs opacity-50">§{color.code}</span>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="border-t border-green-800/30 pt-3">
        <div className="text-xs text-green-600 mb-2 flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Estilos de texto
        </div>
        <div className="grid grid-cols-3 gap-2">
          {textStyles.map((style) => (
            <Button
              key={style.code}
              onClick={() => insertCode(style.code)}
              className="bg-black hover:bg-green-900/30 border border-green-700 hover:border-green-500 text-green-400 transition-all duration-200 relative"
            >
              {style.name}
              <span className="absolute bottom-0 right-1 text-xs opacity-50">§{style.code}</span>
            </Button>
          ))}
        </div>
      </div>
      
      <div className="border-t border-green-800/30 pt-3">
        <div className="text-xs text-green-600 mb-2 flex items-center">
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </div>
        <div className="bg-black/60 p-3 rounded border border-green-700">
          <div className="text-xs text-green-600/60 mb-1">&gt; Resultado:</div>
          <p className="p-2 border border-green-900 bg-black rounded font-minecraft" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
      
      <Button 
        onClick={createCharacter} 
        disabled={creating || !name.trim() || !characterFormat.trim()}
        className="w-full bg-green-700 hover:bg-green-600 text-black hover:shadow-neon transition-all duration-300 mt-2 flex items-center justify-center disabled:opacity-50"
      >
        {creating ? (
          <span className="animate-pulse flex items-center">Procesando...</span>
        ) : (
          <>
            <Plus className="mr-2 w-4 h-4" />
            Crear Personaje
          </>
        )}
      </Button>
      
      <div className="text-xs text-green-700 mt-2 bg-black/40 p-2 border border-green-900/50 rounded">
        <div className="flex items-start mb-1">
          <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
          <span>Los personajes creados serán visibles para todos los administradores.</span>
        </div>
        <div className="flex items-center">
          <Check className="w-3 h-3 mr-1 flex-shrink-0" />
          <span>Usa §r para resetear el formato al final de cada sección coloreada.</span>
        </div>
      </div>
    </div>
  )
}
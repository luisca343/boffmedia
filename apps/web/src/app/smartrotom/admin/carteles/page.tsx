"use client"

import { useState, useEffect } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, Plus, Minus, Copy, Check, MapPin } from 'lucide-react'
import HighwaySign from './_components/HighwaySign'
import { env } from '@/config/env.public'

interface Destination {
  name: string
  distance: string
  direction: "down" | "left" | "right"
}

export default function CartelesAutopista() {
  const [highway, setHighway] = useState('')
  const [destinations, setDestinations] = useState<Destination[]>([{ name: '', distance: '', direction: 'down' }])
  const [signUrl, setSignUrl] = useState('')
  const [copied, setCopied] = useState(false)

  const handleAddDestination = () => {
    if (destinations.length < 4) {
      setDestinations([...destinations, { name: '', distance: '', direction: 'down' }])
    }
  }

  const handleRemoveDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index))
  }

  const handleDestinationChange = (index: number, field: string, value: string) => {
    const next = [...destinations]
    next[index] = { ...next[index], [field]: value }
    setDestinations(next)
  }

  useEffect(() => {
    const baseUrl = env.NEXT_PUBLIC_URL
    let url = `${baseUrl}/smartrotom/cartel?highway=${encodeURIComponent(highway)}`
    destinations.forEach((dest, index) => {
      if (dest.name || dest.distance) {
        url += `&dest${index + 1}=${encodeURIComponent(dest.name)}&dist${index + 1}=${encodeURIComponent(dest.distance)}&dir${index + 1}=${encodeURIComponent(dest.direction)}`
      }
    })
    setSignUrl(url)
  }, [highway, destinations])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(signUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><MapPin size={20} /> OGT Explorer</h1>
        <p className="sr-page-sub">Generador de señales de carretera para el servidor</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', alignItems: 'start' }}>
        {/* Form */}
        <div className="sr-panel">
          <div className="sr-panel-head">
            <span className="sr-ttl">Configuración de señal</span>
          </div>
          <div className="sr-panel-body sr-col" style={{ gap: 14 }}>
            <div className="sr-field">
              <label>// Nombre de la carretera</label>
              <input
                className="sr-input"
                value={highway}
                onChange={e => setHighway(e.target.value)}
                placeholder="ej. A-2"
              />
            </div>

            {destinations.map((dest, index) => (
              <div key={index} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="sr-faint" style={{ fontSize: 11 }}>// Destino {index + 1}</span>
                  {index > 0 && (
                    <button className="sr-btn sr-danger sr-sm" onClick={() => handleRemoveDestination(index)}>
                      <Minus size={12} />
                    </button>
                  )}
                </div>
                <div className="sr-col" style={{ gap: 8 }}>
                  <input
                    className="sr-input"
                    placeholder="Nombre del destino"
                    value={dest.name}
                    onChange={e => handleDestinationChange(index, 'name', e.target.value)}
                  />
                  <input
                    className="sr-input"
                    placeholder="Distancia (ej. 2.5km)"
                    value={dest.distance}
                    onChange={e => handleDestinationChange(index, 'distance', e.target.value)}
                  />
                  <div className="sr-seg">
                    {(['down', 'left', 'right'] as const).map(dir => (
                      <button
                        key={dir}
                        className={dest.direction === dir ? 'sr-on' : ''}
                        onClick={() => handleDestinationChange(index, 'direction', dir)}
                        title={dir}
                      >
                        {dir === 'down' ? <ArrowDown size={13} /> : dir === 'left' ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {destinations.length < 4 && (
              <button className="sr-btn" onClick={handleAddDestination}>
                <Plus size={14} /> Agregar destino
              </button>
            )}
          </div>
        </div>

        {/* Preview + URL */}
        <div className="sr-col" style={{ gap: 'var(--gap)' }}>
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">Vista previa</span>
            </div>
            <div className="sr-panel-body" style={{ display: 'flex', justifyContent: 'center', background: '#0a0a0a' }}>
              <HighwaySign
                highway={highway}
                destinations={destinations}
                width={400}
                height={200}
              />
            </div>
          </div>

          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">URL generada</span>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 10 }}>
              <div style={{
                background: 'var(--bg-0)',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                padding: '10px 12px',
                fontSize: 12,
                color: 'var(--fg-muted)',
                wordBreak: 'break-all',
                fontFamily: 'var(--mono)',
                maxHeight: 80,
                overflowY: 'auto',
              }}>
                {signUrl || <span style={{ color: 'var(--fg-faint)' }}>Completa el formulario…</span>}
              </div>
              <button
                className="sr-btn"
                onClick={copyToClipboard}
                disabled={!signUrl}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copiado' : 'Copiar URL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

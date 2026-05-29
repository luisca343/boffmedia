"use client"

import { useState, useEffect } from 'react'
import { Users, Search, LayoutGrid, MessageSquare, ChevronRight, AlertTriangle } from 'lucide-react'
import { UsersService } from '@/services/api/smartrotom/usersService'
import Link from 'next/link'

interface SRUser {
  id: number
  uuid: string
  username?: string
  minecraft_username?: string
  online?: boolean
  xp?: number
  balance?: number
  level?: number
}

type Filter = 'all' | 'online' | 'offline'

export default function UsuariosPage() {
  const [users, setUsers] = useState<SRUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState<SRUser | null>(null)

  useEffect(() => {
    setLoading(true)
    UsersService.findAll()
      .then((res: any) => {
        if (res.statusCode === 200 && Array.isArray(res.data)) setUsers(res.data)
        else setError('No se pudieron cargar los usuarios.')
      })
      .catch(() => setError('Error al cargar usuarios.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter(u => {
    if (filter === 'online' && !u.online) return false
    if (filter === 'offline' && u.online) return false
    if (query) {
      const q = query.toLowerCase()
      return (u.username || '').toLowerCase().includes(q) ||
             (u.minecraft_username || '').toLowerCase().includes(q) ||
             u.uuid.toLowerCase().includes(q)
    }
    return true
  })

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="sr-spin" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div className="sr-banner sr-crit"><AlertTriangle size={14} /> {error}</div>
    </div>
  )

  return (
    <>
      <div className="sr-page-head">
        <h1 className="sr-page-title"><Users size={20} /> Jugadores</h1>
        <p className="sr-page-sub">{users.length} jugadores registrados</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: 'var(--gap)', alignItems: 'start' }}>
        <div className="sr-panel">
          <div className="sr-toolbar">
            <div className="sr-seg">
              {(['all', 'online', 'offline'] as Filter[]).map(f => (
                <button key={f} className={filter === f ? 'sr-on' : ''} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Todos' : f === 'online' ? 'Online' : 'Offline'}
                </button>
              ))}
            </div>
            <div className="sr-search" style={{ flex: 1 }}>
              <Search size={13} />
              <input
                placeholder="Buscar jugador…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="sr-empty" style={{ margin: 16 }}>
              <div className="sr-ic"><Users size={28} /></div>
              <div className="sr-t">Sin jugadores</div>
            </div>
          ) : (
            <table className="sr-dg">
              <thead>
                <tr>
                  <th></th>
                  <th>Jugador</th>
                  <th>Minecraft</th>
                  <th>UUID</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr
                    key={u.uuid}
                    onClick={() => setSelected(u)}
                    style={{ cursor: 'pointer', background: selected?.uuid === u.uuid ? 'rgba(132,204,22,0.06)' : undefined }}
                  >
                    <td>
                      <span className="sr-svc-dot" style={{ background: u.online ? 'var(--ok)' : 'var(--fg-faint)', width: 8, height: 8 }} />
                    </td>
                    <td className="sr-strong">{u.username || `Usuario ${u.id}`}</td>
                    <td className="sr-muted">{u.minecraft_username || '—'}</td>
                    <td className="sr-faint" style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{u.uuid.slice(0, 12)}…</td>
                    <td><ChevronRight size={14} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selected && (
          <div className="sr-panel">
            <div className="sr-panel-head">
              <span className="sr-ttl">{selected.username || `Usuario ${selected.id}`}</span>
              <button className="sr-btn sr-ghost sr-sm" onClick={() => setSelected(null)}>✕</button>
            </div>
            <div className="sr-panel-body sr-col" style={{ gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="sr-kv">
                  <span className="sr-k">ID</span>
                  <span className="sr-v">{selected.id}</span>
                </div>
                <div className="sr-kv">
                  <span className="sr-k">Estado</span>
                  <span className={`sr-badge${selected.online ? ' sr-ok' : ''}`}>
                    {selected.online ? 'Online' : 'Offline'}
                  </span>
                </div>
                {selected.xp !== undefined && (
                  <div className="sr-kv">
                    <span className="sr-k">XP</span>
                    <span className="sr-v">{selected.xp?.toLocaleString()}</span>
                  </div>
                )}
                {selected.balance !== undefined && (
                  <div className="sr-kv">
                    <span className="sr-k">Balance</span>
                    <span className="sr-v">{selected.balance?.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="sr-kv">
                <span className="sr-k">UUID</span>
                <span className="sr-v" style={{ fontFamily: 'var(--mono)', fontSize: 11, wordBreak: 'break-all' }}>{selected.uuid}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link
                  href={`/smartrotom/admin/apps?player=${selected.uuid}`}
                  className="sr-btn"
                  style={{ justifyContent: 'flex-start', gap: 8, display: 'flex', alignItems: 'center' }}
                >
                  <LayoutGrid size={14} /> Gestionar apps
                </Link>
                <Link
                  href={`/smartrotom/admin/arceuspeak?target=${selected.uuid}`}
                  className="sr-btn"
                  style={{ justifyContent: 'flex-start', gap: 8, display: 'flex', alignItems: 'center' }}
                >
                  <MessageSquare size={14} /> Enviar mensaje
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

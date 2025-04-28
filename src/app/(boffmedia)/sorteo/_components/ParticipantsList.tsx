import { useState } from "react"
import { Users, UserX, Trophy, Search, XCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

type ParticipantsListProps = {
  participants: string[]
  previousWinners: string[]
  onRemove: (name: string) => void
}

export default function ParticipantsList({ 
  participants, 
  previousWinners,
  onRemove 
}: ParticipantsListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"participants" | "winners">("participants")
  
  const filteredParticipants = participants.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.localeCompare(b))
  
  return (
    <div className="bg-surface-800/70 backdrop-blur-sm border border-surface-700 rounded-xl p-6 shadow-lg h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-surface-50">
          {activeTab === "participants" ? "Participantes" : "Ganadores Previos"}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("participants")}
            className={`p-2 rounded-md ${
              activeTab === "participants" 
                ? "bg-primary-500 text-white" 
                : "bg-surface-700 text-surface-300 hover:bg-surface-600"
            }`}
            title="Ver participantes"
          >
            <Users size={16} />
          </button>
          <button
            onClick={() => setActiveTab("winners")}
            className={`p-2 rounded-md ${
              activeTab === "winners" 
                ? "bg-yellow-500 text-white" 
                : "bg-surface-700 text-surface-300 hover:bg-surface-600"
            }`}
            title="Ver ganadores previos"
          >
            <Trophy size={16} />
          </button>
        </div>
      </div>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-surface-400" />
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-surface-700 border-surface-600 text-surface-50"
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-2.5 text-surface-400 hover:text-surface-50"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === "participants" ? (
          <>
            <div className="text-sm text-surface-400 mb-2">
              {filteredParticipants.length} participantes
            </div>
            {filteredParticipants.length > 0 ? (
              <ul className="space-y-2">
                {filteredParticipants.map((name) => (
                  <li 
                    key={name}
                    className="flex items-center justify-between p-3 bg-surface-700 rounded-md group hover:bg-surface-600"
                  >
                    <span className="text-surface-50 truncate">{name}</span>
                    <button 
                      onClick={() => onRemove(name)}
                      className="text-surface-400 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                      title="Eliminar participante"
                    >
                      <UserX size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-center text-surface-400">
                <Users size={48} className="mb-4 opacity-50" />
                {searchTerm ? (
                  <p>No se encontraron participantes que coincidan con "{searchTerm}"</p>
                ) : (
                  <p>Añade participantes para comenzar</p>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-sm text-surface-400 mb-2">
              {previousWinners.length} ganadores previos
            </div>
            {previousWinners.length > 0 ? (
              <ul className="space-y-2">
                {previousWinners.map((name, index) => (
                  <li 
                    key={`${name}-${index}`}
                    className="flex items-center p-3 bg-gradient-to-r from-yellow-900/30 to-surface-700 rounded-md"
                  >
                    <Trophy size={16} className="text-yellow-500 mr-3" />
                    <span className="text-yellow-100">{name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center h-60 text-center text-surface-400">
                <Trophy size={48} className="mb-4 opacity-50" />
                <p>Todavía no hay ganadores</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
import { useState } from "react"
import { UserPlus, Upload, Play, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type GiveawayControlsProps = {
  onAddParticipant: (name: string) => void
  onUploadList: (list: string[]) => void
  onStartGiveaway: () => void
  participantCount: number
}

export default function GiveawayControls({
  onAddParticipant,
  onUploadList,
  onStartGiveaway,
  participantCount
}: GiveawayControlsProps) {
  const [newParticipant, setNewParticipant] = useState("")
  const [participantList, setParticipantList] = useState("")
  const [activeTab, setActiveTab] = useState("single")
  
  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault()
    if (newParticipant.trim()) {
      onAddParticipant(newParticipant.trim())
      setNewParticipant("")
    }
  }
  
  const handleUploadList = () => {
    const names = participantList
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean)
    
    if (names.length > 0) {
      onUploadList(names)
      setParticipantList("")
    }
  }
  
  return (
    <Card className="bg-surface-800/70 backdrop-blur-sm border-surface-700">
      <CardHeader>
        <CardTitle className="text-2xl text-surface-50">Configurar Sorteo</CardTitle>
        <CardDescription className="text-surface-400">
          Añade participantes individualmente o sube una lista completa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 bg-surface-700">
            <TabsTrigger value="single" className="data-[state=active]:bg-primary-500">
              <UserPlus className="mr-2 h-4 w-4" />
              Individual
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-primary-500">
              <Upload className="mr-2 h-4 w-4" />
              Lista
            </TabsTrigger>
          </TabsList>
          <TabsContent value="single" className="mt-4">
            <form onSubmit={handleAddSingle} className="flex gap-2">
              <Input
                placeholder="Nombre del participante"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                className="bg-surface-700 border-surface-600"
              />
              <Button type="submit" variant="secondary">Añadir</Button>
            </form>
          </TabsContent>
          <TabsContent value="list" className="mt-4 space-y-4">
            <Textarea
              placeholder="Añade un nombre por línea..."
              value={participantList}
              onChange={(e) => setParticipantList(e.target.value)}
              rows={5}
              className="bg-surface-700 border-surface-600"
            />
            <Button 
              onClick={handleUploadList}
              variant="secondary" 
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Cargar Lista
            </Button>
          </TabsContent>
        </Tabs>
        
        {participantCount === 0 && (
          <div className="flex items-center bg-amber-950/50 text-amber-300 p-4 rounded-md mb-6">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            <p className="text-sm">Añade al menos un participante para iniciar el sorteo</p>
          </div>
        )}
        
        <div className="text-center py-4">
          <p className="text-surface-300 mb-2">
            {participantCount} participantes listos para el sorteo
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onStartGiveaway} 
          className="w-full bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 text-white"
          disabled={participantCount === 0}
        >
          <Play className="mr-2 h-5 w-5" />
          Iniciar Sorteo
        </Button>
      </CardFooter>
    </Card>
  )
}
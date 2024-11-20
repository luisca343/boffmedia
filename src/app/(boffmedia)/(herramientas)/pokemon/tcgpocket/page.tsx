'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, CreditCard, ChevronRight } from 'lucide-react'
import BoffLayout from '@/app/(boffmedia)/_components/BoffLayout'

export default function TCGPocket() {
    const [username, setUsername] = useState('')
    const router = useRouter()

    const handleViewGallery = () => {
        if (username.trim()) {
            router.push(`/pokemon/tcgpocket/galeria/${username}`)
        }
    }

    const menuItems = [
        { title: 'Ver Galería', description: 'Explora tu colección de cartas', icon: Users, href: '/pokemon/tcgpocket/galeria' },
        { title: 'Lista de Cartas', description: 'Navega por todas las cartas disponibles', icon: CreditCard, href: '/pokemon/tcgpocket/cartas' },
    ]

    return (
        <BoffLayout>
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-8 text-primary-300">TCGPocket</h1>
                
                <Card className="mb-8 bg-surface-800 border-surface-700">
                    <CardHeader>
                        <CardTitle>Buscar Galería</CardTitle>
                        <CardDescription>Ingresa un nombre de usuario para ver su galería</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex space-x-2">
                            <Input
                                type="text"
                                placeholder="Nombre de usuario"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-surface-700 border-surface-600 text-white"
                            />
                            <Button onClick={handleViewGallery} disabled={!username.trim()}>
                                <Search className="mr-2 h-4 w-4" /> Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    {menuItems.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card 
                                className="bg-surface-800 border-surface-700 hover:bg-surface-700 transition-colors cursor-pointer"
                                onClick={() => router.push(item.href)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <item.icon className="mr-2 h-6 w-6" />
                                        {item.title}
                                    </CardTitle>
                                    <CardDescription>{item.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ChevronRight className="ml-auto h-6 w-6 text-primary-300" />
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </BoffLayout>
    )
}
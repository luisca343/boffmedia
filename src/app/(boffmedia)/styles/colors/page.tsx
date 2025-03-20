"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { GamepadIcon as GameController, Palette, Zap } from "lucide-react"

export default function ThemePreview() {
  const [theme, setTheme] = useState<string>("default")

  return (
    <div className="container mx-auto p-4">
      <div className="absolute inset-0 bg-black/50 -z-10"></div>

      <h1 className="text-3xl font-bold mb-6 lexend-mega text-white">Gaming Theme Preview</h1>

      <Tabs defaultValue="default" onValueChange={setTheme} className="mb-8">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="default">Default Theme</TabsTrigger>
          <TabsTrigger value="neon">Neon Theme</TabsTrigger>
          <TabsTrigger value="retro">Retro Theme</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-4 lexend-mega text-white">UI Components</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary-500">Game Dashboard</CardTitle>
                <CardDescription className="text-surface-300">
                  Preview your gaming components with the new color scheme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button className="bg-primary-600 hover:bg-primary-700">Play Now</Button>
                  <Button variant="outline" className="border-secondary-500 text-secondary-500">
                    Settings
                  </Button>
                  <Button variant="ghost" className="text-accent-500 hover:bg-accent-100 hover:text-accent-600">
                    Leaderboard
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <GameController className="h-5 w-5 text-primary-500" />
                    <span className="text-surface-900 dark:text-surface-50">Active Players</span>
                  </div>
                  <span className="font-bold text-highlight-500">1,248</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-secondary-500" />
                    <span className="text-surface-900 dark:text-surface-50">Server Status</span>
                  </div>
                  <span className="font-bold text-success-500">Online</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-accent-500" />
                    <span className="text-surface-900 dark:text-surface-50">Active Theme</span>
                  </div>
                  <span className="font-bold capitalize text-surface-900 dark:text-surface-50">{theme}</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-primary-500 text-white rounded-md text-center font-semibold shadow-md">
                Primary
              </div>
              <div className="p-4 bg-secondary-500 text-white rounded-md text-center font-semibold shadow-md">
                Secondary
              </div>
              <div className="p-4 bg-accent-500 text-white rounded-md text-center font-semibold shadow-md">Accent</div>
              <div className="p-4 bg-highlight-500 text-white rounded-md text-center font-semibold shadow-md">
                Highlight
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4 lexend-mega text-white">Color Palette</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <div
                  key={`primary-${weight}`}
                  className="aspect-square rounded-md border border-surface-200 dark:border-surface-700"
                  style={{ backgroundColor: `rgb(var(--primary-${weight}))` }}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <div
                  key={`secondary-${weight}`}
                  className="aspect-square rounded-md border border-surface-200 dark:border-surface-700"
                  style={{ backgroundColor: `rgb(var(--secondary-${weight}))` }}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <div
                  key={`accent-${weight}`}
                  className="aspect-square rounded-md border border-surface-200 dark:border-surface-700"
                  style={{ backgroundColor: `rgb(var(--accent-${weight}))` }}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) => (
                <div
                  key={`highlight-${weight}`}
                  className="aspect-square rounded-md border border-surface-200 dark:border-surface-700"
                  style={{ backgroundColor: `rgb(var(--highlight-${weight}))` }}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((weight) => (
                <div
                  key={`surface-${weight}`}
                  className="aspect-square rounded-md border border-surface-200 dark:border-surface-700"
                  style={{ backgroundColor: `rgb(var(--surface-${weight}))` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


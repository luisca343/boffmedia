"use client"

import { RotomError, RotomErrorPage } from "@/components/smartrotom/RotomError"
import { 
  ROTOM_ERROR_CODES,
  RotomErrorCodeKey
} from "@/components/smartrotom/RotomErrorSystem"
import { useState } from "react"
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectLabel,
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/primitives/select"
import { Button } from "@/components/ui/primitives/button"
import { Switch } from "@/components/ui/primitives/switch"
import { Label } from "@/components/ui/primitives/label"
import { Input } from "@/components/ui/primitives/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

export default function ErrorPreviewPage() {
  const errorKeys = Object.keys(ROTOM_ERROR_CODES) as RotomErrorCodeKey[];
  const defaultErrorCode = errorKeys.length > 0 ? errorKeys[0] : "" as RotomErrorCodeKey;
  
  const [selectedErrorCode, setSelectedErrorCode] = useState<RotomErrorCodeKey>(defaultErrorCode)
  const [showHelp, setShowHelp] = useState(true)
  const [fullPage, setFullPage] = useState(false)
  const [customAction, setCustomAction] = useState(false)
  const [actionText, setActionText] = useState("Reintentar")
  const [customContext, setCustomContext] = useState<Record<string, string>>({})
  const [contextKey, setContextKey] = useState("")
  const [contextValue, setContextValue] = useState("")

  const errorsByDomain: Record<string, Array<RotomErrorCodeKey>> = {};
  
  Object.keys(ROTOM_ERROR_CODES).forEach((key) => {
    const errorKey = key as RotomErrorCodeKey;
    const errorDef = ROTOM_ERROR_CODES[errorKey];
    
    if (errorDef && errorDef.domain) {
      if (!errorsByDomain[errorDef.domain]) {
        errorsByDomain[errorDef.domain] = [];
      }
      
      errorsByDomain[errorDef.domain].push(errorKey);
    }
  });

  const addContextItem = () => {
    if (contextKey && contextValue) {
      setCustomContext({
        ...customContext,
        [contextKey]: contextValue
      });
      setContextKey("");
      setContextValue("");
    }
  };

  const removeContextItem = (key: string) => {
    const newContext = { ...customContext };
    delete newContext[key];
    setCustomContext(newContext);
  };

  const handleActionClick = () => {
    alert("¡Acción ejecutada!");
  };

  const ErrorComponent = fullPage ? RotomErrorPage : RotomError;

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6 space-x-2">
        <Link href="/smartrotom" className="hover:opacity-80">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold">Visor de Errores SmartRotom</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración</CardTitle>
              <CardDescription>Personaliza la visualización del error</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="error-code" className="mb-2 block">Código de Error</Label>
                <Select 
                  value={selectedErrorCode} 
                  onValueChange={value => setSelectedErrorCode(value as RotomErrorCodeKey)}
                >
                  <SelectTrigger id="error-code">
                    <SelectValue placeholder="Selecciona un error" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(errorsByDomain).sort().map(domain => (
                      <SelectGroup key={domain}>
                        <SelectLabel className="px-2 py-1.5 text-sm font-semibold">
                          {domain}
                        </SelectLabel>
                        {errorsByDomain[domain].map(errorKey => (
                          <SelectItem key={errorKey} value={errorKey}>
                            {errorKey} - {
                              ROTOM_ERROR_CODES[errorKey]?.message?.substring(0, 30) + 
                              (ROTOM_ERROR_CODES[errorKey]?.message?.length > 30 ? '...' : '')
                            }
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="show-help" 
                  checked={showHelp}
                  onCheckedChange={setShowHelp}
                />
                <Label htmlFor="show-help">Mostrar ayuda</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch 
                  id="full-page" 
                  checked={fullPage}
                  onCheckedChange={setFullPage}
                />
                <Label htmlFor="full-page">Vista página completa</Label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="custom-action" 
                    checked={customAction}
                    onCheckedChange={setCustomAction}
                  />
                  <Label htmlFor="custom-action">Acción personalizada</Label>
                </div>
                
                {customAction && (
                  <div>
                    <Label htmlFor="action-text" className="mb-1 block">Texto del botón</Label>
                    <Input 
                      id="action-text" 
                      value={actionText}
                      onChange={e => setActionText(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contexto</CardTitle>
              <CardDescription>Añade datos de contexto al error</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  <Input 
                    className="col-span-2"
                    placeholder="Clave" 
                    value={contextKey}
                    onChange={e => setContextKey(e.target.value)}
                  />
                  <Input 
                    className="col-span-2"
                    placeholder="Valor" 
                    value={contextValue}
                    onChange={e => setContextValue(e.target.value)}
                  />
                  <Button onClick={addContextItem} className="col-span-1">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {Object.keys(customContext).map(key => (
                    <div key={key} className="flex justify-between items-center bg-muted p-2 rounded">
                      <div>
                        <span className="font-medium">{key}:</span> {customContext[key]}
                      </div>
                      <Button 
                        onClick={() => removeContextItem(key)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="preview" className="h-full">
            <TabsList>
              <TabsTrigger value="preview">Vista previa</TabsTrigger>
              <TabsTrigger value="code">Código</TabsTrigger>
            </TabsList>
            
            <TabsContent value="preview" className="h-full pt-4">
              <div className={fullPage ? "bg-primary-400 h-[calc(100vh-14rem)] flex items-center justify-center rounded-lg" : "h-full flex items-center justify-center"}>
                <ErrorComponent 
                  errorCode={selectedErrorCode}
                  context={customContext}
                  onAction={customAction ? handleActionClick : undefined}
                  actionText={actionText}
                  showHelp={showHelp}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Código de implementación</CardTitle>
                  <CardDescription>Copia este código para usar este error</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{`import { ${fullPage ? 'RotomErrorPage' : 'RotomError'} } from "@/components/smartrotom/RotomError";
                    import { ROTOM_ERROR_CODES } from "@/components/smartrotom/RotomErrorSystem";

                    // ...

                    return (
                    <${fullPage ? 'RotomErrorPage' : 'RotomError'}
                        errorCode={"${selectedErrorCode}"}${Object.keys(customContext).length ? `
                        context={{
                    ${Object.keys(customContext).map(key => `      ${key}: "${customContext[key]}"`).join(',\n')}
                        }}` : ''}${customAction ? `
                        onAction={() => {
                        // Tu acción personalizada aquí
                        }}
                        actionText="${actionText}"` : ''}
                        showHelp={${showHelp}}
                    />
                    );`}</code>
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
"use client"
import { Input } from "@/components/ui/primitives/input"
import { Label } from "@/components/ui/primitives/label"
import { Textarea } from "@/components/ui/primitives/textarea"
import { Button } from "@/components/ui/primitives/button"
import { useJsonToDbUnit } from "../_hooks/useJsonToDbUnit";

interface MainContentProps {
  isSidebarCollapsed: boolean;
}

export function MainContent({ isSidebarCollapsed }: MainContentProps) {
  const { tableName, setTableName, jsonInput, setJsonInput, xmlOutput, convertToXml } = useJsonToDbUnit()

  return (
    <div className={`flex-1 p-6 transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : 'ml-60'}`}>
      <div className="bg-[#EDEFF5] p-6 mb-6">
        <h1 className="text-[1.6em] text-[#1d71b8] mb-2">Conversor JSON a DBUnit XML</h1>
      </div>

      <form>
        <fieldset className="w-auto p-[0.15em_0.3em_0.2em_0.4em] m-[0.15em] border border-solid border-[#c4c4c4] rounded-[4px]">
          <legend className="block p-0 mb-[22px] text-[1.4em] font-bold leading-[inherit] text-[#1d71b8] border-0">
            Datos de conversión
          </legend>
          
          <div className="LayoutCamposVertical space-y-4">
            <div className="LayoutCamposHorizontal clear-both float-left relative w-full py-[0.1em] px-0">
              <div>
                <Label htmlFor="tableName" className="block text-[0.8em] font-bold text-[#346ea1] bg-[url('/recursosweb/imaxes/formularios/frecha_fondo_formulario.gif')] bg-no-repeat bg-right-center">
                  Nombre de la tabla
                </Label>
                <Input
                  id="tableName"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Ingresa el nombre de la tabla"
                  className="bg-white w-full mt-1 px-3 py-2 border border-[#ccc] rounded-md shadow-sm focus:outline-none focus:ring-secondary-500 focus:border-secondary-500 text-black"
                />
              </div>
            </div>

            <div className="LayoutCamposHorizontal clear-both float-left relative w-full py-[0.1em] px-0">
              <div className="w-full">
                <Label htmlFor="jsonInput" className="block text-[0.8em] font-bold text-[#346ea1] bg-[url('/recursosweb/imaxes/formularios/frecha_fondo_formulario.gif')] bg-no-repeat bg-right-center">
                  Entrada JSON
                </Label>
                <Textarea
                  id="jsonInput"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Pega tu JSON aquí"
                  rows={10}
                  className="bg-white w-full mt-1 px-3 py-2 border border-[#ccc] rounded-md shadow-sm focus:outline-none focus:ring-secondary-500 focus:border-secondary-500"
                />
              </div>
            </div>

            <div className="LayoutCamposHorizontal clear-both float-left relative w-full py-[0.1em] px-0">
              <Button 
                onClick={convertToXml} 
                type="button"
                className="botazul mt-2 px-3 py-2 bg-[#1d71b8] text-white rounded-md hover:bg-[#16568c]"
              >
                Convertir a XML
              </Button>
            </div>

            <div className="LayoutCamposHorizontal clear-both float-left relative w-full py-[0.1em] px-0">
              <div className="w-full">
                <Label htmlFor="xmlOutput" className="block text-[0.8em] font-bold text-[#346ea1] bg-[url('/recursosweb/imaxes/formularios/frecha_fondo_formulario.gif')] bg-no-repeat bg-right-center">
                  Salida XML
                </Label>
                <Textarea
                  id="xmlOutput"
                  value={xmlOutput}
                  readOnly
                  rows={15}
                  className="w-full mt-1 px-3 py-2 border border-[#ccc] rounded-md shadow-sm bg-[#edeff5] font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </div>
  )
}
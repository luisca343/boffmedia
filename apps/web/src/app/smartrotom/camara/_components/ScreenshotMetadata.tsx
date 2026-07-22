import { MapPin, Info } from "lucide-react"
import { useTranslations } from "next-intl"
import type { Screenshot } from "@/stores/cameraGalleryStore"

interface ScreenshotMetadataProps {
  screenshot: Screenshot
}

export function ScreenshotMetadata({ screenshot }: ScreenshotMetadataProps) {
  const t = useTranslations("camara")
  return (
    <div className="w-80 border-l border-gray-700 bg-gray-900/50 overflow-y-auto shrink-0">
      <div className="p-4 space-y-4">
        {/* Timestamp */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2">{t("metadata.timestamp")}</h3>
          <p className="text-sm text-white">
            {new Date(screenshot.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Location */}
        {screenshot.location && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {t("metadata.location")}
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-400">{t("metadata.position")}</span>
                <div className="text-white font-mono mt-1">
                  X: {screenshot.location.playerPosition.x.toFixed(2)}<br/>
                  Y: {screenshot.location.playerPosition.y.toFixed(2)}<br/>
                  Z: {screenshot.location.playerPosition.z.toFixed(2)}
                </div>
              </div>
              {screenshot.location.lookingAt && (
                <div>
                  <span className="text-gray-400">{t("metadata.lookingAt")}</span>
                  <div className="text-white mt-1">
                    <span className="font-mono text-xs">{screenshot.location.lookingAt.block}</span>
                    <div className="font-mono text-xs text-gray-400 mt-1">
                      ({screenshot.location.lookingAt.x}, {screenshot.location.lookingAt.y}, {screenshot.location.lookingAt.z})
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Entities */}
        {screenshot.entities && screenshot.entities.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2">
              <Info className="h-3 w-3" />
              {t("metadata.detected", { count: screenshot.entities.length })}
            </h3>
            <div className="space-y-2">
              {screenshot.entities.map((entity, idx) => (
                <div key={idx} className="bg-gray-800/50 rounded p-2 text-sm">
                  {entity.type === 'pokemon' && (
                    <>
                      <div className="font-semibold text-blue-400">Pokémon</div>
                      <div className="text-white mt-1">{entity.species}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        #{entity.dex} • {entity.form}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {entity.distance.toFixed(1)}m away • {entity.coverage}% visible
                      </div>
                    </>
                  )}
                  {entity.type === 'statue' && (
                    <>
                      <div className="font-semibold text-purple-400">{t("metadata.typeStatue")}</div>
                      <div className="text-white mt-1">{entity.species}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        #{entity.dex}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {entity.distance.toFixed(1)}m away • {entity.coverage}% visible
                      </div>
                    </>
                  )}
                  {entity.type === 'npc' && (
                    <>
                      <div className="font-semibold text-green-400">{t("metadata.typeNpc")}</div>
                      <div className="text-white mt-1">{entity.name}</div>
                        <div className="text-xs text-gray-400 mt-1">    
                        {entity.distance.toFixed(1)}m away • {entity.coverage}% visible
                      </div>
                    </>
                  )}


                  {entity.type === 'other' && (
                    <>
                      <div className="font-semibold text-gray-400">{t("metadata.typeEntity")}</div>
                      <div className="text-white mt-1">{entity.name}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {entity.distance.toFixed(1)}m away • {entity.coverage}% visible
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No metadata */}
        {!screenshot.location && (!screenshot.entities || screenshot.entities.length === 0) && (
          <div className="text-sm text-gray-500 italic">
            {t("metadata.noMetadata")}
          </div>
        )}
      </div>
    </div>
  )
}

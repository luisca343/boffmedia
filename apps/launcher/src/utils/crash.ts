import type { LogLine } from "../services/types"

export type CrashDiagnosis = {
  title: string
  message: string
  action: string
}

const RULES: { pattern: RegExp; diagnosis: CrashDiagnosis }[] = [
  {
    pattern: /UnsupportedClassVersionError|more recent version|class file version/i,
    diagnosis: {
      title: "Java incompatible",
      message: "El juego se ha ejecutado con una versión de Java distinta a la que necesita este pack.",
      action: "Deja la ruta de Java vacía en Ajustes o selecciona un runtime compatible.",
    },
  },
  {
    pattern: /OutOfMemoryError|Java heap space|Could not reserve enough space/i,
    diagnosis: {
      title: "Memoria insuficiente",
      message: "La JVM se quedó sin memoria durante el arranque o la carga del mundo.",
      action: "Sube la memoria asignada si el equipo tiene RAM libre y cierra otras aplicaciones.",
    },
  },
  {
    pattern: /MixinApplyError|MixinTransformerError|mixin.*(?:failed|error)|org\.spongepowered\.asm\.mixin/i,
    diagnosis: {
      title: "Conflicto de mixins",
      message: "Un mod no ha podido aplicar una transformación al juego.",
      action: "Revisa la versión del mod indicada al final del registro o repara el pack.",
    },
  },
  {
    pattern: /NoClassDefFoundError|ClassNotFoundException|missing dependency|requires mod/i,
    diagnosis: {
      title: "Dependencia ausente",
      message: "Falta una clase o dependencia que otro mod necesita para arrancar.",
      action: "Actualiza o repara el pack para volver a descargar sus dependencias.",
    },
  },
  {
    pattern: /ModLoadingException|Failed to load mod|Error loading mods|mod loading/i,
    diagnosis: {
      title: "Error cargando mods",
      message: "El loader ha rechazado uno de los mods durante la inicialización.",
      action: "Consulta las últimas líneas del registro para identificar el mod responsable.",
    },
  },
  {
    pattern: /GLFW error|OpenGL|could not create the window|failed to create.*display/i,
    diagnosis: {
      title: "Problema gráfico",
      message: "Minecraft no ha podido crear la ventana o inicializar OpenGL.",
      action: "Actualiza los drivers gráficos y comprueba que el juego usa la GPU correcta.",
    },
  },
]

/** Finds the most actionable known failure in the tail of the game log. */
export function diagnoseCrash(logs: LogLine[]): CrashDiagnosis | null {
  const text = logs
    .filter((line) => line.source === "game")
    .slice(-160)
    .map((line) => line.text)
    .join("\n")

  if (!text) return null
  return RULES.find((rule) => rule.pattern.test(text))?.diagnosis ?? null
}

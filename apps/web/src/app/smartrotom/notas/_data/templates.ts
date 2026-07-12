import type { IconName } from "../_components/ui";

export interface NoteTemplate {
  id: string;
  name: string;
  icon: IconName;
  desc: string;
  content: string;
}

// Built-in starter templates (client-side; creating one POSTs a new note).
export const TEMPLATES: NoteTemplate[] = [
  {
    id: "set",
    name: "Análisis de Set",
    icon: "swatch",
    desc: "EVs, movimientos y matchups de un Pokémon.",
    content:
      '<h1>Nombre del Pokémon — Rol</h1><p class="lead">Resumen en una línea del propósito del set.</p><h2>Spread</h2><table><thead><tr><th>Stat</th><th>EVs</th><th>Nota</th></tr></thead><tbody><tr><td>PS</td><td></td><td></td></tr><tr><td>Atq / At.Esp</td><td></td><td></td></tr><tr><td>Velocidad</td><td></td><td></td></tr></tbody></table><h2>Movimientos</h2><ol><li></li><li></li><li></li><li></li></ol><h2>Matchups clave</h2><ul><li></li></ul>',
  },
  {
    id: "team",
    name: "Equipo Competitivo",
    icon: "layers",
    desc: "Núcleo de 6, plan de partida y checklist.",
    content:
      '<h1>Equipo — Nombre</h1><p class="lead">Idea del equipo en una línea.</p><h2>Núcleo</h2><ul><li></li><li></li></ul><h2>Plan de partida</h2><p><br></p><h2>Checklist</h2><ul class="todo"><li data-done="false">Calcular EVs</li><li data-done="false">Probar en ladder</li></ul>',
  },
  {
    id: "raid",
    name: "Estrategia de Raid",
    icon: "zap",
    desc: "Roles, fases y temporización.",
    content:
      '<h1>Raid — Objetivo</h1><p class="lead">Composición y plan.</p><h2>Roles</h2><ul><li><strong>Atacante:</strong> </li><li><strong>Soporte:</strong> </li></ul><h2>Fases</h2><ol><li></li></ol>',
  },
  {
    id: "diary",
    name: "Entrada de Diario",
    icon: "file-text",
    desc: "Tareas del día y reflexiones.",
    content:
      '<h1>Entrada de diario</h1><ul class="todo"><li data-done="false">Tarea 1</li></ul><blockquote>Reflexión del día…</blockquote>',
  },
  {
    id: "blank",
    name: "Nota en blanco",
    icon: "file",
    desc: "Empieza desde cero.",
    content: "<h1>Nueva nota</h1><p><br></p>",
  },
];

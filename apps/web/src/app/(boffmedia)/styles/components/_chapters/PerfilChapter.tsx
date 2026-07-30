"use client"

import { Sample, Section } from "../showcase-shared"
import { Badge, Button, Panel } from "@boffmedia/ui"
import { AccountForm, ActivityFeed, DEMO_ACTIVITY, DEMO_RANK, DEMO_STATS, DEMO_TOUR, DEMO_TROPHIES, LinkedAccountRow, LinkedAccounts, ProfileHero, ProfileNote, RankStrip, TourLive, TrophyCase } from "@/components/boffmedia/ui/profile"

export function PerfilChapter() {

  return (
    <>
            <Section
              id="pf-identidad"
              kicker="Perfil"
              title="Identidad"
              lead={<>La cabecera de perfil (<code>ProfileHero</code>): banda de portada con textura de retransmisión, lower-third con avatar biselado, identidad y métricas rápidas. En <code>/perfil</code> se muestra sin las métricas de ejemplo y con subida de avatar real.</>}
            >
              <Sample title="Cabecera" code="<ProfileHero>" col note={<>Con <code>editable</code> aparecen los botones de cámara; <code>live</code> enciende la bandera «EN VIVO». El avatar cae a la inicial cuando no hay imagen.</>}>
                <ProfileHero
                  name="RotomChef"
                  handle={<>@<b>rotomchef</b> · Miembro desde 2023</>}
                  initial="R"
                  live
                  editable
                  metrics={[{ v: "#42", l: "Ranking" }, { v: "4 180", l: "Puntos" }]}
                  tags={<><Badge tone="new">Admin</Badge><Badge tone="live">Minecraft</Badge></>}
                />
              </Sample>
            </Section>

            <Section
              id="pf-rango"
              kicker="Perfil"
              title="Rango y stats"
              lead={<>Insignia de rango (<code>RankInsignia</code>) con barra de progreso y rejilla de <code>StatTile</code>, combinadas en <code>RankStrip</code>. Datos de ejemplo: aún sin API de estadísticas por usuario.</>}
            >
              <Sample title="Tira de rango" code="<RankStrip>" col>
                <RankStrip rank={DEMO_RANK} stats={DEMO_STATS} />
              </Sample>
            </Section>

            <Section
              id="pf-vitrina"
              kicker="Perfil"
              title="Vitrina de logros"
              lead={<>Rejilla de trofeos (<code>TrophyCase</code> / <code>TrophyCard</code>) con estados conseguido y bloqueado, y sello de rareza.</>}
            >
              <Sample title="Trofeos" code="<TrophyCase>" col>
                <TrophyCase trophies={DEMO_TROPHIES} />
              </Sample>
            </Section>

            <Section
              id="pf-actividad"
              kicker="Perfil"
              title="Actividad"
              lead={<>Línea temporal de actividad (<code>ActivityFeed</code> / <code>ActivityRow</code>) con conector vertical entre hitos.</>}
            >
              <Sample title="Feed" code="<ActivityFeed>" col>
                <Panel title="Actividad reciente">
                  <ActivityFeed items={DEMO_ACTIVITY} />
                </Panel>
              </Sample>
            </Section>

            <Section
              id="pf-vinculadas"
              kicker="Perfil"
              title="Cuenta y enlaces"
              lead={<>Formulario de cuenta (<code>AccountForm</code>) y cuentas vinculadas (<code>LinkedAccounts</code> / <code>LinkedAccountRow</code>). En <code>/perfil</code> se rellenan con la sesión real.</>}
            >
              <Sample title="Datos de la cuenta" code="<AccountForm>" col note={<>Controlado; deshabilitado salvo en modo edición. La biografía es solo demostración (sin API).</>}>
                <Panel title="Datos de la cuenta">
                  <AccountForm
                    editing
                    showBio
                    values={{ name: "RotomChef", email: "rotom@boffmedia.es", bio: "Entrenador de VGC y cazador a tiempo parcial." }}
                  />
                </Panel>
              </Sample>
              <Sample title="Cuentas vinculadas" code="<LinkedAccounts>" col>
                <Panel title="Cuentas vinculadas">
                  <LinkedAccounts>
                    <LinkedAccountRow icon="google" name="Google" hue="#ea4335" linked sub="rotom@gmail.com" end={<Badge tone="ok">Vinculado</Badge>} />
                    <LinkedAccountRow icon="discord" name="Discord" hue="#5865F2" sub="Sin vincular" end={<Button size="sm" icon="link">Vincular</Button>} />
                    <LinkedAccountRow icon="gamepad" name="Minecraft" hue="#3fbf5f" linked sub="RotomChef" end={<Badge tone="ok">Vinculado</Badge>} />
                  </LinkedAccounts>
                </Panel>
              </Sample>
            </Section>

            <Section
              id="pf-torneo"
              kicker="Perfil"
              title="Torneo en curso"
              lead={<>Banner de torneo en directo (<code>TourLive</code>) y la nota de vista pública (<code>ProfileNote</code>).</>}
            >
              <Sample title="Torneo en directo" code="<TourLive>" col>
                <TourLive {...DEMO_TOUR} />
              </Sample>
              <Sample title="Nota de vista pública" code="<ProfileNote>" col>
                <ProfileNote>Estás viendo el perfil público de un usuario.</ProfileNote>
              </Sample>
            </Section>
    </>
  )
}

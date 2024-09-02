import { InternalLink } from "@/components/nav/Link"
import { Slider } from "@/components/ui/slider"
import { useState } from "react"


export type MoveData = {
    attackIndex: number,
    attackName: string,
    attackType: string,
    attackCategory: string,
    basePower: number,
    ppBase: number,
    ppMax: number,
    accuracy: number,
    makesContact: boolean,
    effects: Effect[],
    targetingInfo: {
        hitsAll: boolean,
        hitsOppositeFoe: boolean,
        hitsAdjacentFoe: boolean,
        hitsExtendedFoe: boolean,
        hitsSelf: boolean,
        hitsAdjacentAlly: boolean,
        hitsExtendedAlly: boolean
    },
    z: {
        crystal: string,
        attackName: string,
        basePower: number,
        effects: any[],
        allowedPokemon: any[]
    }[]
}

export type Effect = {
    type: string,
    amount: number,
    isUser: boolean,
    modifiers: any[],
    persists: boolean,
    effectTypeID: string,
    weather?: string,
    percentRecoil?: number,
    weatherRock?: string,
    priority?: number,

    minHits: number,
    maxHits: number,
    stages: number,
}



export function MoveEffect({effect} : {effect: Effect}){
    switch(effect.effectTypeID){
        case 'StatsEffect':
            return (
                <div>{effect.amount > 0 ?
                    <span>Aumenta {effect.amount} niveles de {effect.type}</span> :
                    <span>Reduce {effect.amount} niveles de {effect.type}</span>
                }</div>
            )
        case 'AlwaysHit':
            return <div>Siempre acierta {effect.weather && `en ${effect.weather}`}</div>
        case 'Burn': 
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de quemar al objetivo</span>
                :   <span>Quema al objetivo</span>}
            </div>
        case 'Confusion':
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de confundir al objetivo</span>
                :   <span>Confunde al objetivo</span>}
            </div>
        case 'Flinch':
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de hacer retroceder al objetivo</span>
                :   <span>Hace retroceder al objetivo</span>}
            </div>
        case 'Freeze':
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de congelar al objetivo</span>
                :   <span>Congela al objetivo</span>}
            </div>
        case 'Paralysis':
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de paralizar al objetivo</span>
                :   <span>Paraliza al objetivo</span>}
            </div>
        case 'Sleep':
            return <div>
                {effect.modifiers.length > 0 
                ?   <span>{effect.modifiers[0].value} % de probabilidad de dormir al objetivo</span>
                :   <span>Duerme al objetivo</span>}
            </div>
        case 'PartialTrap':
            return <span>Atrapa al objetivo</span>
        case 'Recoil':
            return <span>Recibe {effect.percentRecoil}% del daño realizado como daño de retroceso</span>
        case 'Rainy':
            return <span>Hace que empiece a llover por 5 turnos, 8 si el usuario lleva equipado {effect.weatherRock}</span>
        case 'Sandstorm':
            return <span>Invoca una tormenta de arena por 5 turnos, 8 si el usuario lleva equipado {effect.weatherRock}</span>
        case 'Sunny':
            return <span>Invoca un día soleado por 5 turnos, 8 si el usuario lleva equipado {effect.weatherRock}</span>
        case 'SwitchOut':
            return <span>El usuario es cambiado por otro Pokémon del equipo despues de realizar el movimiento</span>
        case 'Eruption':
            return <div>
                El poder de este movimiento depende de la vida restante del usuario
                <EruptionCalculator />
            </div>
        case 'WeatherBall':
            return <span>El tipo de este movimiento depende del clima</span>
        case 'SolarBeam': case 'MeteorBeam': case 'SkullBash': case 'Fly': 
        case 'Dig': case 'Dive': case 'Bounce': case 'SkyDrop': case 'ShadowForce': 
        case 'PhantomForce': case 'SkyAttack': case 'RazorWind': case 'SkullBash': 
        case 'SolarBlade': case 'FreezeShock': case 'IceBurn': case 'SkyDrop': case 'SkyAttack': 
        case 'PhantomForce': case 'ShadowForce': case 'FocusPunch': case 'RazorWind':
            return <span>Este movimiento se carga durante un turno y se ejecuta en el siguiente</span>
        case 'DoomDesire': case 'FutureSight':
            return <span>Este movimiento se ejecuta dos turnos después de ser usado</span>
        case 'Charge':
            return <span>Este movimiento aumenta el poder de los movimientos eléctricos del usuario en un 50% durante 2 turnos</span>
        case 'DefenseCurl':
            return <span>Este movimiento duplica el poder de <InternalLink href="/pokedex/movimientos/Rollout">Rollout</InternalLink> y <InternalLink href="/pokedex/movimientos/Ice Ball">Ice Ball</InternalLink></span>
        case 'Rollout': case 'IceBall':
            return <span>Este movimiento dobla su poder con cada uso consecutivo: 30, 60, 120, 240, 480</span>
        case 'Stockpile':
            return <span>Este movimiento almacena cargas que aumentan la defensa y la especial defensa del usuario en 1 nivel por carga. Puede almacenar hasta 3 cargas</span>
        case 'SpitUp':
            return <span>Este movimiento consume las cargas almacenadas por <InternalLink href="/pokedex/movimientos/Stockpile">Stockpile</InternalLink> para aumentar su poder.
                La potencia será de 100 si hay 1 carga, 200 si hay 2 cargas, 300 si hay 3 cargas</span>
        case 'Swallow':
            return <span>Este movimiento consume las cargas almacenadas por <InternalLink href="/pokedex/movimientos/Stockpile">Stockpile</InternalLink> para aumentar la vida del usuario.
                Recupera 25% de la vida si hay 1 carga, 50% si hay 2 cargas, 75% si hay 3 cargas</span>
        case 'Spikes':
            return <span>Este movimiento coloca hasta ${effect.maxLayers} de púas que dañan a los Pokémon que entran en el campo</span>
        case 'StealthRock':
            return <span>Este movimiento coloca rocas que dañan a los Pokémon que entran en el campo</span>
        case 'StickyWeb':
            return <span>Este movimiento coloca una telaraña que reduce la velocidad de los Pokémon que entran en el campo</span>
        case 'ToxicSpikes':
            return <span>Este movimiento coloca hasta ${effect.maxLayers} de púas venenosas que envenenan a los Pokémon que entran en el campo</span>
        case 'Tailwind':
            return <span>Este movimiento aumenta la velocidad de los Pokémon del equipo durante 4 turnos</span>
        case 'TrickRoom':
            return <span>Este movimiento invierte el orden de los Pokémon en el campo durante 5 turnos</span>
        case 'Reflect':
            return <span>Este movimiento aumenta la defensa de los Pokémon del equipo durante 5 turnos. Puede aumentar a 8 turnos si el usuario lleva equipado Refleluz</span>
        case 'LightScreen':
            return <span>Este movimiento aumenta la especial defensa de los Pokémon del equipo durante 5 turnos. Puede aumentar a 8 turnos si el usuario lleva equipado Pantalla Luz</span>
        case 'AuroraVeil':
            return <span>Este movimiento aumenta la defensa y la especial defensa de los Pokémon del equipo durante 5 turnos. Solo funciona con granizo. Puede aumentar a 8 turnos si el usuario lleva equipado Velo Aurora</span>
        case 'Mist':
            return <span>Este movimiento protege a los Pokémon del equipo de cambios de estadísticas negativos</span>
        case 'Safeguard':
            return <span>Este movimiento protege a los Pokémon del equipo de cambios de estado durante 5 turnos</span>
        case 'MistyTerrain':
            return <div>Genera un campo de niebla con los siguientes efectos:
                <ul>
                    <li>Los Pokémon en el suelo no pueden ser afectados por cambios de estado</li>
                    <li>El daño de loss movimientos de tipo Dragón se reduce a la mitad</li>
                    <li><InternalLink href="/pokedex/movimientos/Nature Power">Nature Power</InternalLink> se convierte en <InternalLink href="/pokedex/movimientos/Moonblast">Moonblast</InternalLink></li>
                    <li><InternalLink href="/pokedex/movimientos/Camouflage">Camouflage</InternalLink> convierte al usuario en tipo Hada</li>
                    <li><InternalLink href="/pokedex/movimientos/Secret Power">Secret Power</InternalLink> tiene un 30% de probabilidades de bajar el ataque especial del objetivo</li>
                    
                    <li>Si el usuario lleva equipado un Cubresuelos el campo durará 8 turnos</li>
                    <li>Si el usuario lleva equipado Semilla Bruma aumentará su defensa especial en 1 nivel</li>
                    
                    <li>Si el usuario tiene la habilidad Mimetismo se convierte en tipo Hada</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Misty Explosion">Misty Explosion</InternalLink> aumenta su potencia a 150</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Terrain Pulse">Terrain Pulse</InternalLink> se convierte en Tipo Hada y aumenta su potencia a 100</li>
                </ul>
            </div>
        case 'GrassyTerrain':
            return <div>Genera un campo de hierba con los siguientes efectos:
                <ul>
                    <li>Los Pokémon en el suelo recuperan un 1/16 de su vida al final de cada turno</li>
                    <li>La potencia de los movimientos de tipo Planta de los Pokémon en el suelo se aumenta en un 30%</li>
                    <li>El daño de los movimientos <InternalLink href="/pokedex/movimientos/Earthquake">Earthquake</InternalLink>, <InternalLink href="/pokedex/movimientos/Bulldoze">Bulldoze</InternalLink> y <InternalLink href="/pokedex/movimientos/Magnitude">Magnitude</InternalLink> se reduce a la mitad</li>
                    
                    <li><InternalLink href="/pokedex/movimientos/Nature Power">Nature Power</InternalLink> se convierte en <InternalLink href="/pokedex/movimientos/Energy Ball">Energy Ball</InternalLink></li>
                    <li><InternalLink href="/pokedex/movimientos/Camouflage">Camouflage</InternalLink> convierte al usuario en tipo Planta</li>
                    <li><InternalLink href="/pokedex/movimientos/Secret Power">Secret Power</InternalLink> tiene un 30% de probabilidades de dormir al objetivo</li>
                    <li>Si el usuario lleva equipado un Cubresuelos el campo durará 8 turnos</li>
                    <li>Si el usuario lleva equipado Semilla Hierba aumentará su defensa en 1 nivel</li>
                    <li>Activa la habilidad Fanto Frondoso</li>
                    
                    <li>Si el usuario tiene la habilidad Mimetismo se convierte en tipo Planta</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Grassy Glide">Grassy Glide</InternalLink> tiene prioridad +1</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Terrain Pulse">Terrain Pulse</InternalLink> se convierte en Tipo Planta y aumenta su potencia a 100</li>
                </ul>
            </div>
        case 'PsychicTerrain':
            return <div>Genera un campo psíquico con los siguientes efectos:
                <ul>
                    <li>Los Pokémon en el suelo no pueden ser afectados por movimientos de prioridad</li>
                    <li>La potencia de los movimientos de tipo Psíquico de los Pokémon en el suelo se aumenta en un 30%</li>
                    
                    <li><InternalLink href="/pokedex/movimientos/Nature Power">Nature Power</InternalLink> se convierte en <InternalLink href="/pokedex/movimientos/Psychic">Psychic</InternalLink></li>
                    <li><InternalLink href="/pokedex/movimientos/Camouflage">Camouflage</InternalLink> convierte al usuario en tipo Psíquico</li>
                    <li><InternalLink href="/pokedex/movimientos/Secret Power">Secret Power</InternalLink> tiene un 30% de probabilidades de bajar la defensa especial del objetivo</li>
                    <li>Si el usuario lleva equipado un Cubresuelos el campo durará 8 turnos</li>
                    
                    <li>Si el usuario lleva equipado Semilla Psique aumentará su defensa especial en 1 nivel</li>
                    <li>Activa la habilidad Terreno Psíquico</li>
                    
                    <li>Si el usuario tiene la habilidad Mimetismo se convierte en tipo Psíquico</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Expanding Force">Expanding Force</InternalLink> tiene prioridad +1</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Terrain Pulse">Terrain Pulse</InternalLink> se convierte en Tipo Psíquico y aumenta su potencia a 100</li>
                </ul>
            </div>
        case 'ElectricTerrain':
            return <div>Genera un campo eléctrico con los siguientes efectos:
                <ul>
                    <li>Los Pokémon en el suelo no pueden ser paralizados</li>
                    <li>La potencia de los movimientos de tipo Eléctrico de los Pokémon en el suelo se aumenta en un 30%</li>
                    
                    <li><InternalLink href="/pokedex/movimientos/Nature Power">Nature Power</InternalLink> se convierte en <InternalLink href="/pokedex/movimientos/Thunderbolt">Thunderbolt</InternalLink></li>
                    <li><InternalLink href="/pokedex/movimientos/Camouflage">Camouflage</InternalLink> convierte al usuario en tipo Eléctrico</li>
                    <li><InternalLink href="/pokedex/movimientos/Secret Power">Secret Power</InternalLink> tiene un 30% de probabilidades de paralizar al objetivo</li>
                    <li>Si el usuario lleva equipado un Cubresuelos el campo durará 8 turnos</li>
                    
                    <li>Si el usuario lleva equipado Semilla Electro aumentará su velocidad en 1 nivel</li>
                    <li>Activa la habilidad Terreno Eléctrico</li>
                    
                    <li>Si el usuario tiene la habilidad Mimetismo se convierte en tipo Eléctrico</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Rising Voltage">Rising Voltage</InternalLink> tiene prioridad +1</li>
                    <li>El movimiento <InternalLink href="/pokedex/movimientos/Terrain Pulse">Terrain Pulse</InternalLink> se convierte en Tipo Eléctrico y aumenta su potencia a 100</li>

                    <li>Si el usuario posee la habilidad Carga Cuark, potenciará su estadísica más alta</li>
                    <li>Hace que el movimiento <InternalLink href="/pokedex/movimientos/Psyblade ">Psyblade</InternalLink> aumente su potencia a 120</li>
                </ul>
            </div>
        case 'MudSport':
            return <span>Reduce la potencia de los movimientos de tipo Eléctrico</span>
        case 'WaterSport':
            return <span>Reduce la potencia de los movimientos de tipo Fuego</span>
        case 'Gravity':
            return <span>Elimina los efectos de levitación y de volar durante 5 turnos</span>
        case 'HealBlock':
            return <span>Impide a los Pokémon en el campo recuperar vida durante 5 turnos</span>
        case 'MagicRoom':
            return <span>Los objetos no tienen efecto durante 5 turnos</span>
        case 'WonderRoom':
            return <span>Intercambia las defensas y las defensas especiales de los Pokémon en el campo durante 5 turnos</span>
        case 'Trick':
            return <span>Intercambia los objetos del usuario y del objetivo</span>
        case 'Embargo':
            return <span>Impide al objetivo usar objetos durante 5 turnos</span>
        case 'Entrainment':
            return <span>El objetivo copia la habilidad del usuario</span>
        case 'SkillSwap':
            return <span>El usuario y el objetivo intercambian habilidades</span>
        case 'RolePlay':
            return <span>El usuario copia la habilidad del objetivo</span>
        case 'GastroAcid':
            return <span>El objetivo pierde su habilidad</span>
        case 'SimpleBeam':
            return <span>El objetivo obtiene la habilidad Simple</span>
        case 'WorrySeed':
            return <span>El objetivo obtiene la habilidad Insomnio</span>
        case 'Bestow':
            return <span>El usuario cede su objeto al objetivo</span>
        case 'Thief':
            return <span>El usuario roba el objeto del objetivo</span>
        case 'KnockOff':
            return <span>El objetivo pierde su objeto</span>
        case 'TrickOrTreat':
            return <span>El objetivo se convierte en tipo Fantasma</span>
        case 'ForestCurse':
            return <span>El objetivo se convierte en tipo Planta</span>
        case 'Conversion':
            return <span>El usuario se convierte en tipo del primer movimiento del objetivo</span>
        case 'Conversion2':
            return <span>El usuario se convierte en tipo del movimiento que más daño le haría al objetivo</span>
        case 'ReflectType':
            return <span>El usuario se convierte en tipo del objetivo</span>
        case 'Soak':
            return <span>El objetivo se convierte en tipo Agua</span>
        case 'Camouflage':
            return <span>El usuario se convierte en tipo Normal</span>
        case 'BurnUp':
            return <span>El usuario pierde su tipo Fuego</span>
        case 'Roost':
            return <span>El usuario recupera el 50% de su vida máxima y pierde su tipo volador durante 1 turno</span>
        case 'Defog':
            return <span>Elimina los cambios de evasión y los obstáculos del campo</span>
        case 'Haze':
            return <span>Elimina los cambios de estadísticas de los Pokémon en el campo</span>
        case 'ClearSmog':
            return <span>Elimina los cambios de estadísticas del objetivo</span>
        case 'HeartSwap':
            return <span>Intercambia los cambios de estadísticas del usuario y del objetivo</span>
        case 'PowerSwap':
            return <span>Intercambia los cambios de ataque y ataque especial del usuario y del objetivo</span>
        case 'GuardSwap':
            return <span>Intercambia los cambios de defensa y defensa especial del usuario y del objetivo</span>
        case 'AquaRing':
            return <span>El usuario recupera el 1/16 de su vida al final de cada turno</span>
        case 'Ingrain':
            return <span>El usuario recupera el 1/16 de su vida al final de cada turno y no puede ser cambiado de posición</span>
        case 'LeechSeed':
            return <span>El objetivo pierde el 1/8 de su vida al final de cada turno y el usuario recupera la misma cantidad</span>
        case 'Acrobatics':
            return <span>Este movimiento duplica su poder si el usuario no lleva equipado ningún objeto</span>
        case 'CriticalHit':
            return <span>Este movimiento aumenta en {effect.stages > 1 ? `${effect.stages} niveles` : '1 nivel' } la probabilidad de golpe crítico del usuario</span>
        case 'MultipleHit':
            return <span>Este movimiento golpea {getHitCount(effect)} veces </span>
        case 'Recharge':
            return <span>El usuario no puede realizar movimientos durante el siguiente turno</span>
        case 'Priority':
            return <span>Este movimiento tiene prioridad {effect.priority !== undefined ? (effect.priority > 0 ? `+${effect.priority}` : effect.priority) : 'N/A'}</span>
        case 'MirrorCoat':
            return <span>Refleja el daño especial recibido por el usuario</span>
        case 'Counter':
            return <span>Refleja el daño físico recibido por el usuario</span>
        case 'Protect':
            return <span>El usuario se protege de los movimientos del objetivo</span>
        case 'PetalDance':
            return <span>El usuario se confunde después de usar este movimiento durante 2-3 turnos</span>
        case 'Endure':
            return <span>El usuario sobrevive a un ataque que lo dejaría con menos del 1 de vida</span>
        case 'Refresh':
            return <span>Elimina los cambios de estado del usuario</span>
        case 'Infatuated':
            return <span>El objetivo se enamora del usuario</span>
        case 'Flail':
            return <div>Este movimiento aumenta su poder cuanto menos vida tenga el usuario.
                <FlailCalculator />
            </div>
        case 'MeanLook':
            return <span>Impide al objetivo huir o ser cambiado de posición</span>
        case "Round":
            return <span>Este movimiento aumenta su potencia si otros Pokémon del equipo lo han usado en el mismo turno</span>
        case 'Incinerate':
            return <span>Este movimiento quema las bayas del objetivo</span>        
        case 'Celebrate':
            return <span>Felicidades Luisca</span>
        case 'Flee':
            return <span>Hace que el objetivo huya del combate</span>
        case 'FuryCutter':
            return <span>Este movimiento aumenta su poder con cada uso consecutivo</span>
        case 'SecretPower':
            return <span>Este movimiento tiene un efecto adicional dependiendo del terreno</span>
        case 'BrickBreak':
            return <span>Este movimiento elimina las pantallas de defensa del objetivo</span>
        case 'Rest':
            return <span>El usuario se duerme durante 2 turnos y recupera toda su vida</span>
        case 'NaturalGift':
            return <span>Este movimiento tiene un efecto adicional dependiendo del objeto que lleve equipado el usuario</span>
        case 'EchoedVoice':
            return <span>Este movimiento aumenta su potencia si otros Pokémon del equipo lo han usado en turnos consecutivos</span>
        case 'FalseSwipe':
            return <span>Este movimiento deja al objetivo con al menos 1 de vida</span>
        case 'OHKO':
            return <span>Este movimiento derrota al objetivo si es de un nivel inferior al usuario</span>
        case 'Frustration':
            return <span>Este movimiento aumenta su poder cuanto menos afecto tenga el usuario</span>
        case 'Rage':
            return <span>Este movimiento aumenta su poder con cada uso consecutivo</span>
        case 'DoSetDamage':
            return <span>Este movimiento inflige {effect.damage} PS de daño</span>
        case 'HeavySlam':
            return <span>Este movimiento aumenta su poder cuanto más pesado sea el objetivo</span>
        case 'Facade':
            return <span>Este movimiento aumenta su poder si el usuario está envenenado, paralizado o quemado</span>
        case 'Fling':
            return <span>Este movimiento lanza el objeto equipado por el usuario</span>
        case 'Curse':
            return <span>Si es tipo fantasma: el usuario pierde la mitad de su vida y el objetivo recibe el doble de daño
                Si no: el usuario aumenta su ataque y defensa a cambio de perder velocidad</span>
        case 'HoldHands':
            return <span>No hace nada</span>
        case 'Mimic':
            return <span>El usuario copia el último movimiento usado por el objetivo</span>
        case 'BeatUp':
            return <span>Este movimiento golpea 1 vez por cada Pokémon del equipo</span>
        case 'FlameBurst':
            return <span>Este movimiento daña a los Pokémon adyacentes al objetivo</span>
        case 'RapidSpin':
            return <span>Este movimiento elimina los obstáculos del campo y aumenta la velocidad del usuario</span>
        case 'HiddenPower':
            return <span>Este movimiento tiene un tipo y una potencia variable</span>
        case 'ScaleShot':
            return <span>Aumenta la velocidad del usuario en un nivel, y reduce su defensa en un nivel</span>
        case 'Snore':
            return <span>Este movimiento solo puede ser usado si el usuario está dormido</span>
        case 'SleepTalk':
            return <span>Este movimiento solo puede ser usado si el usuario está dormido</span>
        case 'Substitute':
            return <span>El usuario crea un sustituto que recibe el daño de los movimientos en su lugar</span>
        case 'BellyDrum':
            return <span>El usuario pierde la mitad de su vida para aumentar su ataque al máximo</span>
        case 'Bide':
            return <span>El usuario recibe daño durante 2 turnos y contraataca en el tercero</span>
        case 'Pledge':
            return <span>Este movimiento tiene un efecto adicional si se usa junto con otro movimiento de la misma categoría</span>
        case 'TerrainPulse':
            return <span>Este movimiento tiene un efecto adicional dependiendo del terreno</span>
        case 'Return':
            return <span>Este movimiento aumenta su poder cuanto más afecto tenga el usuario</span>
        case 'FakeOut':
            return <span>Solo puede ser usado en el primer turno después de salir al campo</span>
        case 'TopsyTurvy':
            return <span>Invierte los cambios de estadísticas del objetivo</span>
        case 'ExpandingForce':
            return <span>Si se usa en terreno psíquico, aumenta su potencia a 120 y golpeará a ambos oponentes</span>
        case 'Payback':
            return <span>Este movimiento aumenta su poder si el objetivo ha atacado antes</span>
        case 'PoisonBadly':
            return <span>Envenena gravemente al objetivo</span>
        case 'Telekinesis':
            return <span>Hace que el objetivo levite durante 3 turnos</span>
        case 'Snatch':
            return <span>El usuario roba los cambios de estado del objetivo</span>
        case 'Retaliate':
            return <span>Este movimiento aumenta su poder si un Pokémon del equipo ha sido derrotado en el turno anterior</span>
        case 'Spite':
            return <span>Reduce los PP del último movimiento usado por el objetivo</span>
        case 'BatonPass':
            return <span>El usuario pasa sus cambios de estadísticas al siguiente Pokémon del equipo</span>
        case 'Psywave':
            return <span>Este movimiento inflige un daño variable</span>
        case 'StoredPower':
            return <span>Este movimiento aumenta su poder con cada cambio de estadísticas del usuario</span>
        case 'HappyHour':
            return <span>Duplica las ganancias de dinero al final del combate</span>
        case 'Taunt':
            return <span>Impide al objetivo usar movimientos de estado durante 3 turnos</span>
        case 'DestinyBond':
            return <span>Si el usuario es derrotado, el objetivo también lo será</span>
        case 'PsychUp':
            return <span>El usuario copia los cambios de estadísticas del objetivo</span>
        case 'FoulPlay':
            return <span>Este movimiento usa el ataque del objetivo para calcular su poder</span>
        case 'PowerSplit':
            return <span>El usuario y el objetivo comparten su poder de ataque</span>
        case 'GuardSplit':
            return <span>El usuario y el objetivo comparten su poder de defensa</span>
        case 'LashOut':
            return <span>Este movimiento aumenta su poder si el usuario ha sufrido cambios de estadísticas negativos durante el turno</span>
        case 'AllySwitch':
            return <span>Intercambia la posición del usuario con la de un Pokémon aliado</span>
        case 'Acupressure':
            return <span>El usuario aumenta una estadística aleatoria en 2 niveles</span>
        case 'MagicCoat':
            return <span>Refleja los movimientos de estado del objetivo</span>
        case 'StompingTantrum':
            return <span>Este movimiento aumenta su poder si el último movimiento del usuario falló</span>
        
        default:
            return (
                <div>
                    <span>{effect.effectTypeID}</span>
                </div>
            )
    }

    function getHitCount(effect: Effect){
        const min = effect.minHits
        const max = effect.maxHits

        if(max === 0) return `${min} veces`
        return `entre ${min} y ${max} veces`
        
    }

    function FlailCalculator(){
        const [hp, setHP] = useState([100])
        return (
            <div>
                <span>HP: {hp}%</span>
                <Slider min={0} max={100} defaultValue={hp} onValueChange={(value) => setHP(value)} step={0.1}/>
                <span className="text-center">Poder: {hp[0] > 68.75 ? 20 : hp[0] > 35.42 ? 40 : hp[0] > 20.83 ? 80 : hp[0] > 10.42 ? 100 : hp[0] > 4.17 ? 150 : 200}</span>
            </div>
        )
    }


    function EruptionCalculator(){
        const [hp, setHP] = useState([100])
        return (
            <div>
                <span>HP: {hp}%</span>
                <Slider min={0} max={100} defaultValue={hp} onValueChange={(value) => setHP(value)} step={0.1}/>
                <span className="text-center">Poder: {Math.floor(150 * hp[0] / 100)}</span>
            </div>
        )
    }
}
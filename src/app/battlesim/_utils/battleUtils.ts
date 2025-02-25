export default function countActions( battleLog:string | null ): number {
    return battleLog ? battleLog.split('\n').length : 0;
}
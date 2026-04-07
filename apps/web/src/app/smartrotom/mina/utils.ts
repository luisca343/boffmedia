

// @ts-ignore
import NoiseMap from 'noise-map'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'react-toastify';
import { MinaService } from '@/services/api/smartrotom/minaService';
import { MineReward } from '@boffmedia/shared';


export async function generateGame(numFilas: number, numColumnas: number){
    const rewards = await getRewards() as MineReward[];
    const positions = await generatePositions(numFilas, numColumnas, rewards);
    const map = await getMineMap(numFilas, numColumnas);

    console.log('Mapa generado');
    console.log(map);
    console.log('Posiciones generadas');
    console.log(positions);

    return {map, positions};
}

export async function getMineMap(numFilas: number, numColumnas: number) {
    const generator = new NoiseMap.MapGenerator();
    const heightmap = generator.createMap(numColumnas, numFilas, { type: 'perlin' });

    return Array.from({ length: numFilas }, (_, i) =>
        Array.from({ length: numColumnas }, (_, j) => {
            let valor = heightmap.data[i * numColumnas + j];
            valor = valor > 0.75 ? 6 : valor > 0.5 ? 5 : valor > 0.3 ? 4 : valor > 0.15 ? 3 : valor > 0.01 ? 2 : 1;
            return { i, j, estado: valor };
        })
    );
}

async function getRewards(cantidad: number = 5) {
    const {data: rewards} = await MinaService.getAllRewards();
    const rewardsTmp = []
    console.log(rewards);
    
    if (!rewards) {
        console.error('No rewards found');
        return [];
    }
    let valorTotal = (rewards as MineReward[]).reduce((acc: number, reward: MineReward) => acc + reward.value, 0);
    for (let i = 0; i < cantidad; i++) {
        let valor = Math.random() * valorTotal;
        let reward = rewards.find((reward: MineReward) => {
            valor -= reward.value;
            return valor <= 0;
        });
        rewardsTmp.push(reward);
    }

    console.log(rewardsTmp);
    return rewardsTmp;
}

async function getRewardsNoRepeat(cantidad: number = 5) {
    const {data: rewards} = await MinaService.getAllRewards() as {data: MineReward[]};
    const rewardsTmp = [];
    
    let valorTotal = rewards.reduce((acc:number, reward: MineReward) => acc + reward.value, 0);
    for (let i = 0; i < cantidad; i++) {
        let valor = Math.random() * valorTotal;
        let index = rewards.findIndex((reward: MineReward) => {
            valor -= reward.value;
            return valor <= 0;
        });
        let reward = rewards[index];
        rewardsTmp.push(reward);
        
        // Remove the selected reward from the array and decrease the total value
        rewards.splice(index, 1);
        valorTotal -= reward.value;
    }

    return rewardsTmp;
}

async function generatePositions(rowNum: number, colNum: number, rewards: MineReward[]) {
    const positions = [] as {reward: MineReward ,x: number, y: number}[];
    let errors = 0;

    for(let i = 0; i < rewards.length; i++) {
        console.log('Generando posición válida ' + i + ' de ' + rewards.length + ' recompensas');
        const reward = rewards[i];
        let x = Math.floor(Math.random() * (colNum - reward.width));
        let y = Math.floor(Math.random() * (rowNum - reward.height));

        let overlaps = false;
        for(let j = 0; j < positions.length; j++) {
            console.log('Comparando con posición ' + j);
            if(!overlaps){
                const comparing = positions[j];
                overlaps = validPosition({reward, x, y}, comparing)
            } else {
                console.log('Posición inválida');
                break;
            }
        }

        if(overlaps) {
            errors++;
            if(errors > 100) {
                console.error('Error al generar posiciones');
                return [];
            }
            i--;
        } else {
            console.log('Posición válida');
            positions.push({reward, x, y});
        }

        
    }

    console.log(positions);
    return positions;
}


function  validPosition(rew: {reward: MineReward, x: number, y: number}, comparing: {reward: MineReward, x: number, y: number}) {
    return rew.x < comparing.x + comparing.reward.width &&
        rew.x + rew.reward.width > comparing.x &&
        rew.y < comparing.y + comparing.reward.height &&
        rew.y + rew.reward.height > comparing.y;
}   


export function jugar(session: any, router: AppRouterInstance, redirect: string = "" ){
    MinaService.playGame({uuid: session?.user.smartRotomUser.uuid}).then(res => {
        if(!res.error) return router.push('/smartrotom/mina/jugar')
        toast.error(res.error)
        redirect != "" && router.push(redirect)
    }).catch(err => {
        console.error(err)
    })
}
import { apiGET } from "@/services/boffAPI";

export default async function Test() {
  const partida = await apiGET("/battlesimulator/battle");
  if(!partida.log) return <div>loading...</div>
  return (
    <div className='flex flex-col justify-center'>
      {Object.keys(partida.log).map((key) => (
            <div key={key} className='border m-2 flex justify-around items-center'>
              <img src={partida.log[key].t1.url} alt='pokemon' />
              
              <div className='text-black w-[80%] '>
              <div >Turn {key}</div>
                {partida.log[key].events.map((line, index) => (
                  <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
                ))
              }</div>
              <img src={partida.log[key].t2.url} alt='pokemon' />
            </div>
          ))}
    </div>
  );
}
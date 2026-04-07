import { useEffect, useRef } from "react"
import { Chart } from 'chart.js/auto';

export default function TestChart({data, className}: {className?: string ,data?: any}) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      (chartRef.current as Chart).destroy();
      chartRef.current = null;
    }

    if (!data) return;
    var canvas = document.getElementById('myChart') as HTMLCanvasElement;
    var ctx = canvas.getContext('2d');
    // @ts-ignore
    chartRef.current = new Chart(ctx, {
      options: {
          responsive: true,
          fill: true,
          showLines: false,
          backgroundColor: 'rgba(191, 219, 254 , 0.5)',
          scales: {
              x: {
                  grid: {
                      display: false,
                  },
              },
              y: {
                  grid: {
                      display: false,
                  },
              },
          },
      },
      type: 'line',
      data: data,
  });
  }, [data])

  return (
    <canvas className={className} id='myChart'></canvas>
  )
}
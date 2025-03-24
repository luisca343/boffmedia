interface SharpnessProps {
    sharpness: {
      red: number;
      orange: number;
      yellow: number;
      green: number;
      blue: number;
      white: number;
      purple: number;
    };
  }
  
  export function SharpnessBar({ sharpness }: SharpnessProps) {
    const sharpnessSegments = [
      { key: "red", value: sharpness.red, color: "bg-red-500" },
      { key: "orange", value: sharpness.orange, color: "bg-orange-500" },
      { key: "yellow", value: sharpness.yellow, color: "bg-yellow-500" },
      { key: "green", value: sharpness.green, color: "bg-green-500" },
      { key: "blue", value: sharpness.blue, color: "bg-blue-500" },
      { key: "white", value: sharpness.white, color: "bg-gray-100" },
      { key: "purple", value: sharpness.purple, color: "bg-purple-500" }
    ];
  
    return (
      <div>
        <div className="flex h-3 rounded overflow-hidden">
          {sharpnessSegments.map(segment => (
            segment.value > 0 && (
              <div 
                key={segment.key}
                className={segment.color} 
                style={{ width: `${segment.value}%` }}
              />
            )
          ))}
        </div>
      </div>
    );
  }
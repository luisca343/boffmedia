export function Loading({width= 100, height=100, color= "gray-400"}) {
    return (
        <div className="w-full h-full flex justify-center items-center" style={{width, height}}>
            <div className={`animate-spin rounded-full h-full w-full border-t-2 border-b-2 border-${color}`}></div>
        </div>
    );
}


export function LoadingScreen() {
    return (
        <div className="w-full h-full flex justify-center items-center bg-primary-400">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-surface-700"></div>
        </div>
    );
}
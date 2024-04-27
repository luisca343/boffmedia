export function Loading({width= 100, height=100}) {
    return (
        <div className="w-full h-full flex justify-center items-center" style={{width, height}}>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
        </div>
    );
}


export function LoadingScreen() {
    return (
        <div className="w-full h-full flex justify-center items-center bg-primary-400">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-800"></div>
        </div>
    );
}
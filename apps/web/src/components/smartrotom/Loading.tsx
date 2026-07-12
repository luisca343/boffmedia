import { cn } from "@/lib/utils";

export function Loading({ width = 100, height = 100, colorClass = "border-sr-accent" }) {
    return (
        <div className="flex justify-center items-center" style={{ width, height }}>
            <div
                className={cn("animate-spin rounded-full border-2 border-t-transparent", colorClass)}
                style={{ width: "100%", height: "100%" }}
            />
        </div>
    );
}


export function LoadingScreen() {
    return (
        <div className="w-full h-full flex justify-center items-center bg-sr-bg">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-sr-line border-t-sr-accent"></div>
        </div>
    );
}

import { SkyGenerator } from "@/tools/pmd-sky/SkyGenerator";

export default function PmdPage() {
    return (
        <div className="min-h-screen bg-gray-850 text-orange-100 p-8">
            <div className="max-w-4xl mx-auto">
                <SkyGenerator />
            </div>
        </div>
    );
}
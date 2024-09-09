export interface SmartRotomAchievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    subcategory: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt: Date;
    uuid: string;
    team: string;
    replay: string;
}
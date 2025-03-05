export interface App{
    id: number;
    name: string;
    url: string;
    active: number;    
}

export interface OrderedApp extends App{
    order: number;
}


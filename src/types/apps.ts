export interface BaseApp{
    id: number;
    name: string;
    url: string;
}

export interface App extends BaseApp{
    active: boolean;    
}

export interface OrderedApp extends BaseApp{
    order: number;
}


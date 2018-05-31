export interface IStix {
    id: string;
    [keyString: string]: any;
}

export interface IStixBundle {
    objects: IStix[];
}

export interface IUFStix {
    _id: string;
    stix: IStix;
    metaProperties?: any;
    extendedProperties?: any;   
}

export interface IEnhancedProperties {
    id: string;
    metaProperties?: any;
    extendedProperties?: any; 
}

export interface IConfig {
    configKey: string;
    configValue: any;
    configGroup?: string[];
}

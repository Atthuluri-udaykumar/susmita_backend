export interface IDataResolverService<T extends object> {
    getData(url: string): Promise<T>;
    getDataArray(url: string): Promise<T[]>;
    postData(url: string, data?: any): Promise<T>;
}
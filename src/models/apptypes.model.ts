
export class AppType {
    private name: string;

    static WCS = new AppType("wcs");
    static MRP = new AppType("mrp");
    static GHPRP = new AppType("ghprp");

    constructor( name: string ) {
        this.name = name;
    }

    public value(): string {
        return this.name;
    }
    
    static valueOf( name: string | null | unknown): AppType | null {
        if( typeof name != 'string') {
            return null;
        }

        if( "wcs" == name.toLowerCase() ) {
            return AppType.WCS;
        } 
        if( "mrp" == name.toLowerCase() ) {
            return AppType.MRP;
        } 
        if( "ghprp" == name.toLowerCase() ) {
            return AppType.GHPRP;
        } 
        return null;
    } 
}

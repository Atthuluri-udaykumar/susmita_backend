import { JsonConverter, JsonCustomConvert } from "json2typescript";

export class DateOnly extends Date  {

    public toJSON(key?: any): string {
        return this.toISOString().split('T')[0];
    }

}


@JsonConverter
export class DateOnlyConverter implements JsonCustomConvert<DateOnly> {
    public serialize(date: DateOnly): any {
        return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate()
    }
    public deserialize(date: any): DateOnly {
        return new DateOnly(date);
    }
}

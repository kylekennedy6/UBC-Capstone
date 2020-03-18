import Query from "../parsing/Query";

export default class Sorter {
    private queryObject: Query;
    private readonly entries: Array<Map<string, any>>;
    private readonly sortKey: string;

    constructor(entries: Array<Map<string, any>>, queryObject: Query) {
        this.entries = entries;
        this.queryObject = queryObject;
        this.sortKey = this.queryObject.getSortKey();
    }

    public sortEntriesByKey(): Array<Map<string, any>> {
        const entries = this.entries;
        const key = this.sortKey;
        return entries.sort(Comparator);

        function Comparator(a: Map<string, any>, b: Map<string, any>) {
            if (a.get(key) < b.get(key)) { return -1; }
            if (a.get(key) > b.get(key)) { return 1; }
            return 0;
        }
    }
}

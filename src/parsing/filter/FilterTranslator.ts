import {IFilter} from "./IFilter";
import {error} from "util";

export default class FilterTranslator {
    private criteriaBuckets: IFilter[][];
    private datasetEntries: Array<Map<string, any>>;

    constructor(criteriaBuckets: IFilter[][], datasetEntries: Array<Map<string, any>>) {
        this.criteriaBuckets = criteriaBuckets;
        this.datasetEntries = datasetEntries;
    }

    public getRelevantEntries(): Array<Map<string, any>> {
        if (this.criteriaBuckets[0][0] === undefined) { return this.datasetEntries; }
        const relevantEntries: Array<Map<string, any>> = [];

        // forEach bucket, where a bucket is a list of filters strung together by "and":
        this.criteriaBuckets.forEach((bucket: IFilter[]) => {
            // check each entry for a match of all filters in that bucket
            let entry: Map<string, any>;
            for (entry of this.datasetEntries) {
                // this.datasetEntries.forEach((entry: Map<string, any>) => {
                // if filter matches a bucket and is NOT already in relevant entries, add it to list
                if (matchesBucket(entry, bucket) && !relevantEntries.includes(entry)) {
                    relevantEntries.push(entry);
                }
            }
        });
        return relevantEntries;

        function matchesBucket(entry: Map<string, any>, bucket: IFilter[]): boolean {
            // for each filter in a given bucket, return false if an entry doesn't match, true otherwise
            let filter;
            for (filter of bucket) {
                if (!matchesFilter(entry, filter)) {
                    return false;
                }
            }
            return true;
        }

        function matchesFilter(entry: Map<string, any>, filter: IFilter): boolean {
            const filterKey = translateKey(filter.key);
            const filterOperator = filter.operator.join(" ");
            const filterValueAsString = filter.value;
            const entryValue = entry.get(filterKey);
            const sKeys = ["courses_title", "courses_uuid", "courses_instructor", "courses_id", "courses_dept"];
            const nKeys = ["courses_avg", "courses_audit", "courses_pass", "courses_fail"];
            if (sKeys.includes(filterKey)) {
                const filterValueSansQuotes = filterValueAsString.substring(1, filterValueAsString.length - 1);
                switch (filterOperator) {
                    case "is":
                        return entryValue === filterValueSansQuotes;
                    case "is not":
                        return entryValue !== filterValueSansQuotes;
                    case "includes":
                        return entryValue.includes(filterValueSansQuotes);
                    case "does not include":
                        return !entryValue.includes(filterValueSansQuotes);
                    case "begins with":
                        return entryValue.startsWith(filterValueSansQuotes);
                    case "does not begin with":
                        return !entryValue.startsWith(filterValueSansQuotes);
                    case "ends with":
                        return entryValue.endsWith(filterValueSansQuotes);
                    case "does not end with":
                        return !entryValue.endsWith(filterValueSansQuotes);
                    default:
                        throw error;
                }
            } else if (nKeys.includes(filterKey)) {
                const filterValueAsNum = parseFloat(filterValueAsString);
                switch (filterOperator) {
                    case "is equal to":
                        return entryValue === filterValueAsNum;
                    case "is not equal to":
                        return entryValue !== filterValueAsNum;
                    case "is greater than":
                        return entryValue > filterValueAsNum;
                    case "is not greater than":
                        return entryValue <= filterValueAsNum;
                    case "is less than":
                        return entryValue < filterValueAsNum;
                    case "is not less than":
                        return entryValue >= filterValueAsNum;
                    default:
                        throw error;
                }
            } else {
                throw error;
            }
        }

        function translateKey(key: string): string {
            switch (key) {
                case "Title":
                    return "courses_title";
                case "UUID":
                    return "courses_uuid";
                case "Instructor":
                    return "courses_instructor";
                case "Audit":
                    return "courses_audit";
                case "ID":
                    return "courses_id";
                case "Pass":
                    return "courses_pass";
                case "Fail":
                    return "courses_fail";
                case "Average":
                    return "courses_avg";
                case "Department":
                    return "courses_dept";
                default:
                    throw error;
            }
        }
    }
}

import QueryParser from "./queryString/QueryParser";
import FilterParser from "./filter/FilterParser";
import {IFilter} from "./filter/IFilter";
import {error} from "util";

export default class Query {
    private query: string;
    private queryParser: QueryParser;
    private criteriaParser: FilterParser;

    constructor(query: string) {
        this.query = query;
        this.queryParser = new QueryParser(query);
        this.criteriaParser = new FilterParser(this.queryParser.getFilterCriteria());
    }

    public getDatasetId(): string {
        return this.queryParser.getDatasetId();
    }

    public getCriteriaBuckets(): IFilter[][] {
        const criteriaList = this.criteriaParser.buildCriteriaList(this.queryParser.getFilterCriteria());
        return this.criteriaParser.buildFilterList(criteriaList);
    }

    public getDisplayCriteria(): string[] {
        const criteriaList = this.queryParser.getDisplay();
        const criteria: string[] = [];
        criteriaList.forEach( (word) => {
            if (this.queryParser.isADisplayKey(word)) {
                criteria.push(this.translateKey(word));
            }
        });
        return criteria;
    }

    public getSortKey(): string {
        const sortKey = this.queryParser.getOrderKey();
        if (sortKey === "") { return null;
        } else {
            return this.translateKey(this.queryParser.getOrderKey());
        }
    }

    private translateKey(key: string) {
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
                throw error; }
    }
}

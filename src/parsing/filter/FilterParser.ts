import {IFilter} from "./IFilter";
import {error} from "util";

export default class FilterParser {
    private readonly criteria: string[];
    private mKeys: string[] = ["Average", "Pass", "Fail", "Audit"];
    private sKeys: string[] = ["Department", "ID", "Instructor", "Title", "UUID"];

    constructor(criteria: string[]) {
        this.criteria = criteria;
    }

    public buildFilterList(criteriaList: IFilter[]): IFilter[][] {
        const filterList: IFilter[][] = [];
        let bucket: IFilter[] = [];
        bucket.push(criteriaList[0]);
        let i = 1;
        while (i < criteriaList.length - 1) {
            if (criteriaList[i].key === "and") {
                bucket.push(criteriaList[i + 1]);
                i += 2;
            } else {
                filterList.push(bucket);
                bucket = [];
                bucket.push(criteriaList[i + 1]);
                i += 2;
            }
        }
        filterList.push(bucket);
        return filterList;
        }

    public buildCriteriaList(criteria: string[]): IFilter[] {
        const criteriaList: IFilter[] = [];
        let i = 0;
        try {
            while (i < criteria.length) {
                const current = criteria[i];
                if (this.isValidMathKey(current)) {
                    const criteriaObject: IFilter = this.buildMathCriteria(criteria.slice(i));

                    // base case where query contains only one criteria filter (Math)
                    if (criteriaObject.length === criteria.length) {
                        criteriaList.push(criteriaObject);
                        return criteriaList;
                    } else {
                        criteriaList.push(criteriaObject);
                        i += criteriaObject.length;
                    }
                } else if (this.isValidStringKey(current)) {
                    const criteriaObject: IFilter = this.buildStringCriteria(criteria.slice(i));
                    // base case where query contains only one criteria filter (String)
                    if (criteriaObject.length === criteria.length) {
                        criteriaList.push(criteriaObject);
                        return criteriaList;
                    } else {
                        criteriaList.push(criteriaObject);
                        i += criteriaObject.length;
                    }
                } else if ((criteriaList.length > 0) && (current === "and" || current === "or")) {
                    const criteriaObject: IFilter = {key: current, operator: null, value: null, length: 1};
                    criteriaList.push(criteriaObject);
                    i += 1;
                } else { throw error; }
            }
            return criteriaList;
        } catch (err) {
            throw error;
        }
    }

    public buildStringCriteria(criteria: string[]): IFilter {
        const key = criteria[0];
        const operator = this.buildStringOperator(criteria.slice(1));
        const value = getCriteriaValue(criteria.slice(operator.length + 1));
        const length = operator.length + 1 + value.split(" ").length;
        const stringCriteria: IFilter = {key, operator, value, length};
        return stringCriteria;

        function getCriteriaValue(remaining: string[]) {
            let i;
            let valueLength = 0;
            for (i = 0; i < remaining.length; i++) {
                valueLength ++;
                if (remaining[i].endsWith("\"")) {
                    break;
                }
            }
            return remaining.slice(0, valueLength).join(" ");
        }
    }

    public buildMathCriteria(criteria: string[]): IFilter {
        const key = criteria[0];
        const operator = this.buildMathOperator(criteria.slice(1));
        const value = criteria[operator.length + 1];
        const length = operator.length + 2;
        const mathCriteria: IFilter = {key, operator, value, length};
        return mathCriteria;
    }

    public buildStringOperator(operator: string[]): string[] {
        let i;
        let operatorLength = 0;
        for (i = 1; i < operator.length; i++) {
            operatorLength++;
            if (operator[i].startsWith("\"")) {
                break; }
        }
        return operator.slice(0, operatorLength);
    }

    public buildMathOperator(operator: string[]): string[] {
        let mathOperator: string[];
        const is = operator[0];
        if (is !== "is") {
            throw error;
        }
        if (operator[1] === "not") {
            const not = operator[1];
            if (this.isValidEqualityStatement(operator[2], operator[3])) {
                mathOperator = [is, not, operator[2], operator[3]];
                return mathOperator;
            } else {
                throw error;
            }
        } else if (this.isValidEqualityStatement(operator[1], operator[2])) {
            mathOperator = [is, operator[1], operator[2]];
            return mathOperator;
        } else { throw error; }
    }

    public isValidEqualityStatement(first: string, second: string) {
        return (first === "equal" && second === "to")
            || ((first === "greater" || first === "less") && (second === "than"));
    }

    public isValidMathKey(word: string): boolean { return this.mKeys.includes(word); }

    public isValidStringKey(word: string): boolean { return this.sKeys.includes(word); }

    public isValidNumber(num: string): boolean {
        const digits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const firstChar = num.charAt(0);
        if (digits.includes(firstChar) || firstChar === "-") {
            for (let i = 1; i < num.length; i++) {
                const current = num.charAt(i);
                if (!digits.includes(current) && current !== ".") { return false; }
            }
            return true;
        } else { return false; }
    }

    public isValidString(str: string): boolean {
        const firstChar = str.charAt(0);
        // tslint:disable-next-line:no-console
        console.log(firstChar);
        const lastChar = str.charAt(str.length - 1);
        // tslint:disable-next-line:no-console
        console.log(lastChar);
        if (firstChar !== "\"") { return false; }
        if (lastChar !== "\"") { return false; }
        for (let i = 1; i < str.length - 1; i++) {
            const current = str.charAt(i);
            if (current === "*" || current === "\"") { return false; }
        }
        return true;
    }
}

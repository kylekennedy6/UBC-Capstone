import FilterParser from "../filter/FilterParser";
import {IFilter} from "../filter/IFilter";
import {isNumber, isString} from "util";

export default class QueryParser {
    private readonly query: string;
    private readonly wordList: string[];
    private readonly KEYWORD = ["In", "dataset", "find", "all", "show", "and", "or",
        "sort", "by", "entries", "is", "the", "of", "whose"];
    private readonly M_OP = ["is", "not", "greater than", "less than", "equal to"];
    private readonly S_OP = ["is", "not", "includes", "does not include", "begins with",
        "does not begin with", "ends with", "does not end with"];
    private readonly RESERVED = this.KEYWORD.concat(this.M_OP).concat(this.S_OP);
    private readonly mKeys = ["Average", "Pass", "Fail", "Audit"];
    private readonly sKeys = ["Department", "ID", "Instructor", "Title", "UUID"];
    private readonly KEYS = this.mKeys.concat(this.sKeys);

    constructor(query: string) {
        this.query = query;
        this.wordList = this.query.split(" ");
    }

    // getters

    public getQuery(): string {
        return this.query;
    }

    public getWordList(): string[] {
        return this.wordList;
    }

    public getAllKeys(): string[] {
        return this.mKeys.concat(this.sKeys);
    }

    public getDatasetId(): string {
        const datasetWithPunctuation = this.getDataset()[3];
        return datasetWithPunctuation.substring(0, datasetWithPunctuation.length - 1);
    }

    // returns DATASET portion of query
    public getDataset(): string[] {
        let dataset: string[];
        dataset = this.wordList.slice(0, 3);
        const last = this.wordList[3];
        dataset.push(last);
        return dataset;
    }

    public getPostDatasetCharacter(): string[] {
        const datasetWithComma = this.wordList.slice(0, 4);
        const lastWithComma = datasetWithComma[datasetWithComma.length - 1];
        return [lastWithComma.substring(lastWithComma.length - 1)];
    }

    public getFilterBeginning(): string[] {
        const firstThreeWordsOfFilter = this.wordList.slice(4, 7);
        const first = firstThreeWordsOfFilter[0];
        const second = firstThreeWordsOfFilter[1];
        const last = firstThreeWordsOfFilter[2];
        if (last === "entries;") {
            return [first, second, last.substring(0, last.length - 1)];
        } else {
            return [first, second, last];
        }
    }

    public getFilterCriteria(): string[] {
        const filterBeginning = this.getFilterBeginning();
        if (filterBeginning[0] === "find" && filterBeginning[1] === "all" && filterBeginning[2] === "entries") {
            return [];
        } else {
            const remainingWordList = this.wordList.slice(7);
            const filterCriteria: string[] = [];
            let i;
            for (i = 0; i < remainingWordList.length; i++) {
                let word = remainingWordList[i];
                if (!word.includes(";")) {
                    filterCriteria.push(word);
                } else {
                    word = word.slice(0, -1);
                    filterCriteria.push(word);
                    break;
                }
            }
            return filterCriteria;
        }
    }

    public getPostFilterCharacter(): string[] {
        const postFilterSemiColon = [];
        const filterLength = this.getFilterBeginning().length + this.getFilterCriteria().length;
        const remainingWordList = this.wordList.slice(4);
        const last = remainingWordList[filterLength - 1];
        postFilterSemiColon.push(last.charAt(last.length - 1));
        return postFilterSemiColon;
    }

    public getDisplay(): string[] {
        const remainingWordList = this.wordList.slice(4);
        const display: string[] = [];
        let startIndex = this.getFilterCriteria().length + 3;
        while (startIndex < remainingWordList.length) {
            const word = remainingWordList[startIndex];
            if (word.includes(";") || word.includes(".")) {
                const wordMinusChar = word.substring(0, word.length - 1);
                display.push(wordMinusChar);
                break;
            } else if (word.includes(",")) {
                const wordMinusChar = word.substring(0, word.length - 1);
                display.push(wordMinusChar);
                startIndex++;
            } else {
                display.push(word);
                startIndex++;
            }
        }
        return display;
    }

    public getPostDisplayCharacter(): string[] {
        const remainingWordList = this.wordList;
        const index = this.getDataset().length + this.getFilterBeginning().length +
            this.getFilterCriteria().length + this.getDisplay().length - 1;
        const lastWordOfDisplay = remainingWordList[index];
        return [lastWordOfDisplay.substring(lastWordOfDisplay.length - 1)];
    }

    public getOrder(): string[] {
        const wordList = this.getWordList();
        let order: string[];
        const length = wordList.length;
        const sumOfPartsSoFar = this.getDataset().length + this.getFilterBeginning().length
            + this.getFilterCriteria().length + this.getDisplay().length;
        if (sumOfPartsSoFar === length) {
            order = [];
        } else {
            const startIndex = length - 6;
            const last = wordList[length - 1];
            const lastWithoutPunctuation = last.substring(0, last.length - 1);
            order = wordList.slice(startIndex, wordList.length - 1);
            order.push(lastWithoutPunctuation);
        }
        return order;
    }

    public getOrderKey(): string {
        const length = this.getOrder().length;
        if (length === 0) {return "";
        } else { return this.getOrder()[length - 1]; }
    }

    public getEndOfQueryPunctuation(): string[] {
        const length = this.getWordList().length;
        const lastWord = this.getWordList()[length - 1];
        const lastChar = lastWord.substring(lastWord.length - 1);
        return [lastChar];
    }

    public validateQuery(): boolean {
        return (this.validateDataset()
            &&  this.validatePostDatasetCharacter()
            && this.validateFilterBeginning()
            && this.validateFilterCriteria()
            && this.validatePostFilterCharacter()
            && this.validateDisplay()
            && this.validatePostDisplayCharacter()
            && this.validateOrder()
            && this.validateEndOfQueryPunctuation());
    }

    public validateDataset(): boolean {
        const dataset = this.getDataset();
        // tslint:disable-next-line:no-console
        console.log(dataset);
        if (dataset[0] === "In") {
            if (dataset[1] === "courses") {
                if (dataset[2] === "dataset") {
                    const input = dataset[3].substring(0, dataset[3].length - 1);
                    return (!input.includes("*") && !input.includes("_")
                        && !this.RESERVED.includes(input) && input.length > 0);
                }
            }
        }
        return false;
    }

    public validatePostDatasetCharacter(): boolean {
        const postDatasetCharacter = this.getPostDatasetCharacter();
        return postDatasetCharacter[0] === ",";
    }

    public validateFilterBeginning(): boolean {
        const filter = this.getFilterBeginning();
        if (filter.join(" ") === "find all entries") {
            return true;
        } else {
            if (filter[0] !== "find" || filter[1] !== "entries" || filter[2] !== "whose") {
                return false;
            }
        }
        return true;
    }

    public validateFilterCriteria(): boolean {
        const mKeys = this.mKeys;
        const sKeys = this.sKeys;
        const mOps = ["is equal to", "is not equal to",
            "is greater than", "is not greater than",
            "is less than", "is not less than"];
        const sOps = ["is", "is not",
            "includes", "does not include",
            "begins with", "does not begin with",
            "ends with", "does not end with"];
        const filterBeginning = this.getFilterBeginning();
        const filterCriteria = this.getFilterCriteria();
        if (filterBeginning[1] === "all" && filterBeginning[2] === "entries") {
            return filterCriteria.length === 0;
        } else {
            const filterParser = new FilterParser(filterCriteria);
            try {
                const filters = filterParser.buildCriteriaList(filterCriteria);
                let i;
                for (i = 0; i < filters.length; i++) {
                    const filter: IFilter = filters[i];
                    if (!isValidFilter(filter)) {
                        return false;
                    }
                }
                const lastFilter = filters[filters.length - 1];
                if (lastFilter.key === "and" || lastFilter.key === "or") { return false; }
                return true;
            } catch (err) {
                return false;
            }
        }

        function isValidFilter(filter: IFilter): boolean {
            if (filter.key === "and" || filter.key === "or") {
                return true;
            } else {
                const operatorAsString = filter.operator.join(" ");
                if (mKeys.includes(filter.key)) {
                    const valueAsNum = parseFloat(filter.value);
                    return (mOps.includes(operatorAsString) && !isNaN(valueAsNum));
                } else if (sKeys.includes(filter.key)) {
                    return (sOps.includes(operatorAsString) && isValidStringValue(filter.value));
                }
            }
        }
        function isValidStringValue(value: string): boolean {
            return (!value.includes("*") && !value.substring(1, value.length - 1).includes("\"")
                && value.charAt(0) === "\"" && value.charAt(value.length - 1) === "\"");
        }
    }

    public validatePostFilterCharacter(): boolean {
        const postFilterCharacter = this.getPostFilterCharacter();
        return postFilterCharacter[0] === ";";
    }

    public validateDisplay(): boolean {
        const display = this.getDisplay();
        if (display[0] !== "show" || display.length < 2) {
            return false;
        } else if (display.length === 2) {
            return (this.getAllKeys().includes(display[1]));
        } else {
            for (let i = 1; i < display.length - 2; i++) {
                const word = display[i];
                if (!this.getAllKeys().includes(word)) {
                    return false;
                }
            }
            const secondToLast = display[display.length - 2];
            if (secondToLast !== "and") {
                return false;
            }
            return (this.getAllKeys().includes(display[display.length - 1]));
        }
    }

    public validatePostDisplayCharacter(): boolean {
        const postDisplayCharacter = this.getPostDisplayCharacter();
        const order = this.getOrder();
        if (order.length === 0) { return postDisplayCharacter[0] === ".";
        } else {
            return postDisplayCharacter[0] === ";";
        }
    }

    public validateOrder(): boolean {
        const order = this.getOrder();
        if (order.length === 0) { return true;
        } else if (order.length !== 6) { return false;
        } else {
            return (order[0] === "sort"
                && order[1] === "in"
                && order[2] === "ascending"
                && order[3] === "order"
                && order[4] === "by"
                && this.isADisplayKey(order[5]));
        }
    }

    public validateEndOfQueryPunctuation() {
        return this.getEndOfQueryPunctuation()[0] === "."; }

    public isADisplayKey(word: string): boolean {
        const display = this.getDisplay();
        return this.KEYS.includes(word) && display.includes(word);
    }
}

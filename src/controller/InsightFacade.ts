import Log from "../Util";
import {
    IInsightFacade,
    InsightResponse,
    InsightDatasetKind,
    InsightResponseErrorBody, InsightResponseSuccessBody,
} from "./IInsightFacade";
import * as JSZip from "jszip";
import * as fs from "fs";
import QueryParser from "../parsing/queryString/QueryParser";
import Query from "../parsing/Query";
import FilterTranslator from "../parsing/filter/FilterTranslator";
import Displayer from "../display/Displayer";
import {error} from "util";
import Sorter from "../display/Sorter";
import Dataset from "../dataset/Dataset";

/**
 * This is the main programmatic entry point for the project.
 */
export default class InsightFacade implements IInsightFacade {

    constructor() {
        Log.trace("InsightFacadeImpl::init()");
    }

    public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<InsightResponse> {
        try {
            const newDataset = new Dataset(id, content, kind);
            await newDataset.loadCoursesDataset();
            return {code: 204, body: null};
        } catch (err) {
            throw {code: 400, body: null};
        }
    }

    public removeDataset(id: string): Promise<InsightResponse> {
        try {
            fs.unlinkSync(id + ".json");
            return Promise.resolve({code: 204, body: null});
        } catch (err) {
            return Promise.reject({code: 404, body: null});
        }
    }

    public performQuery(query: string): Promise <InsightResponse> {
        const errorBody: InsightResponseErrorBody = {error: "" };
        try {
        // initialize Query object
        const queryObject = new Query(query);
        const queryParser = new QueryParser(query);
        if (!queryParser.validateQuery()) {
            return Promise.reject({code: 400, body: errorBody});
        }
        // extract dataset name from query, use to find entries json file in memory
        // Parse JSON and convert entries to Array of Maps
        const id = queryObject.getDatasetId();
        const entriesArray = JSON.parse(fs.readFileSync(id + ".json", "utf8"));

        const allEntriesAsMaps: Array<Map<string, any>> = [];
        entriesArray.forEach( (entry: any[][]) => {
            // @ts-ignore
            const map = new Map(entry);
            allEntriesAsMaps.push(map);
        });

        // Retrieve bucketed criteria filters, buckets are arranged such that:
        // One bucket is a list of filters, all of which must be true for entry to be included (captures 'and')
        // An entry must be true for just one bucket in a list of buckets (captures 'or')
        const filters = queryObject.getCriteriaBuckets();

        // initialize CriteriaTranslator object and getRelevantEntries:
        // does heavy lifting in retrieving all raw entries that match a given FILTER
        const criteriaTranslator = new FilterTranslator(filters, allEntriesAsMaps);
        const filteredEntries = criteriaTranslator.getRelevantEntries();
            // tslint:disable-next-line:no-console
        console.log("FILTERED: ", filteredEntries);

        // initialize Sorter object and sort entries by key
        const sorter = new Sorter(filteredEntries, queryObject);
        const sortedEntries = sorter.sortEntriesByKey();
            // tslint:disable-next-line:no-console
        console.log("SORTED: ", sortedEntries);

        // initialize Displayer Object and calls getDisplayedList()
        // Displays only those criteria that were requested by DISPLAY
        const displayer = new Displayer(sortedEntries, queryObject.getDisplayCriteria());
        const displayedEntries: Array<Map<string, any>> = displayer.getDisplayedList();
            // tslint:disable-next-line:no-console
        console.log("DISPLAYED: ", displayedEntries);

        // convert final entry list back to JSON to return to user
        const finalizedEntries: object[] = [];
        displayedEntries.forEach( (entryMap) => {
            const entryObject = {};
            entryMap.forEach( (value, key) => {
                // @ts-ignore
                entryObject[key] = value;
            });
            finalizedEntries.push(entryObject);
        });
        const successResponseBody = {result: finalizedEntries};
        return Promise.resolve({code: 200, body: successResponseBody});
        } catch (err) { return Promise.reject({code: 400, body: null}); }
}

    public listDatasets(): Promise<InsightResponse> {
        return Promise.reject({code: -1, body: null});
    }
}

import {InsightDataset, InsightDatasetKind, InsightResponse} from "../controller/IInsightFacade";
import * as JSZip from "jszip";
import {error} from "util";
import * as fs from "fs";

export default class Dataset {
    private id: string;
    private content: string;
    private kind: InsightDatasetKind;

    constructor(id: string, content: string, kind: InsightDatasetKind) {
        this.id = id;
        this.content = content;
        this.kind = kind;
    }

    public async loadCoursesDataset() {
        if (fs.existsSync( "datasets/" + this.id + ".json")) {throw error; }
        const zip = JSZip();
        const promises: Array<Promise<string>> = [];
        const loadedZip = await zip.loadAsync(this.content, {base64: true}).catch(() => {throw error; });
        loadedZip.folder("courses")
            .forEach(function (relativePath, file) {
                promises.push(file.async("text"));
            });
        const parsedDataset: any[] = [];
        await Promise.all(promises).then((rawData) => {
            rawData.forEach(function (unparsedCSV) {
                if (unparsedCSV.length > 70) {
                    const csvWithValidSection = unparsedCSV.split("\n");
                    csvWithValidSection.shift();
                    csvWithValidSection.pop();
                    csvWithValidSection.forEach(function (section: string) {
                        const parsedSection = section.split("|");
                        const entry = new Map();
                        entry.set("courses_title", parsedSection[0]);
                        entry.set("courses_uuid", parsedSection[1]);
                        entry.set("courses_instructor", parsedSection[2]);
                        entry.set("courses_audit", parseInt(parsedSection[3], 10));
                        entry.set("courses_id", parsedSection[5]);
                        entry.set("courses_pass", parseInt(parsedSection[6], 10));
                        entry.set("courses_fail", parseInt(parsedSection[7], 10));
                        entry.set("courses_avg", parseFloat(parsedSection[8]));
                        const department = parsedSection[9];
                        if (department.includes("\r")) {
                            entry.set("courses_dept", parsedSection[9].substring(0, parsedSection[9].length - 1));
                        } else {
                            entry.set("courses_dept", parsedSection[9]);
                        }
                        const entryAsArray = [...entry];
                        parsedDataset.push(entryAsArray);
                    });
                }
            });
        }).then(() => {
            if (parsedDataset.length === 0) {throw error;
            } else {
                const dataset: InsightDataset = {id: this.id, kind: this.kind, numRows: parsedDataset.length};
                parsedDataset.unshift(dataset);
                const datasetJSON = JSON.stringify(parsedDataset);
                fs.writeFileSync("datasets/" + this.id + ".json", datasetJSON);
            }
        }).catch(() => { throw error; });
    }
}

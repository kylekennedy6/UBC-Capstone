export default class Displayer {
    private entries: Array<Map<string, any>>;
    private displayCriteria: string[];

    constructor(entries: Array<Map<string, any>>, displayCriteria: string[]) {
        this.entries = entries;
        this.displayCriteria = displayCriteria;
    }

    public getDisplayedList(): Array<Map<string, any>> {
        const entriesToDisplay: Array<Map<string, any>> = [];
        this.entries.forEach( (entryMap) => {
            const filteredEntryMap = new Map();
            entryMap.forEach( (value, key) => {
                if (this.displayCriteria.includes(key)) {
                    filteredEntryMap.set(key, value);
                }
            });
            entriesToDisplay.push(filteredEntryMap);
        });
        return entriesToDisplay;
    }
}

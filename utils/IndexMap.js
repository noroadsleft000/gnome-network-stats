/**
 * IndexMap helps you looks up keys based on values.
 */
export class IndexMap {
    constructor(obj) {
        this._reverseMap = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                this._reverseMap[obj[key]] = key;
            }
        }
        this._forwardMap = obj;
    }

    getIndex(value) {
        const index = this._reverseMap[value];
        return index || -1;
    }

    getValue(index) {
        return this._forwardMap[index];
    }
}

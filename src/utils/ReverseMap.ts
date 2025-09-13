/**
 * ReverseMap helps you looks up keys based on values.
 */
export class ReverseMap<
    KeyType extends string | number,
    ValueType extends string | number | symbol
> {
    private _reverseMap: Partial<Record<ValueType, KeyType>>;
    private _forwardMap: Partial<Record<KeyType, ValueType>>;

    constructor(obj: Record<KeyType, ValueType> | Array<ValueType>) {
        this._reverseMap = {};
        this._forwardMap = {};
        for (const key in obj) {
            // @ts-ignore
            const value = obj[key] as ValueType;
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                this._reverseMap[value] = key as KeyType;
                this._forwardMap[key as KeyType] = value as ValueType;
            }
        }
    }

    getKey(value: ValueType, defaultIndex?: KeyType): KeyType | undefined {
        return this._reverseMap[value] ?? defaultIndex;
    }

    getValue(index: KeyType): ValueType {
        return this._forwardMap[index]!;
    }
}

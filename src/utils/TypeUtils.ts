/**
 * Utility class to find out type of a value/object in Javascript
 */
export class TypeUtils {
    static isBoolean<T>(value: T): boolean {
        return typeof value === "boolean";
    }

    static isNumber<T>(value: T): boolean {
        return typeof value === "number";
    }

    static isString<T>(value: T): boolean {
        return typeof value === "string";
    }

    static isUndefined<T>(value: T): boolean {
        return typeof value === "undefined";
    }

    static isNull<T>(value: T): boolean {
        return !value && typeof value === "object";
    }

    static isSymbol<T>(value: T): boolean {
        return typeof value === "symbol";
    }

    static isFunction<T>(value: T): boolean {
        return typeof value === "function";
    }

    static isPermitive<T>(value: T): boolean {
        return (
            this.isBoolean(value) ||
            this.isNumber(value) ||
            this.isString(value) ||
            this.isUndefined(value) ||
            this.isNull(value) ||
            this.isSymbol(value)
        );
    }

    /**
     * Return the typename of given value
     * @param value - Value to check type of
     * @returns typeName of value
     */
    static typeOf<T>(value: T): string {
        if (this.isPermitive(value)) {
            return typeof value;
        }
        return Object.prototype.toString.call(value).slice(8, -1);
    }

    /**
     * Checks if type of given value is same as typeName passed in.
     * @param value - Value to check
     * @param typeName - Expected type name
     * @returns true if type matches with typeName otherwise false.
     */
    static isTypeOf<T>(value: T, typeName: string): boolean {
        return this.typeOf(value) === typeName;
    }

    static isArray<T extends Array<unknown>>(value: T): boolean {
        return this.isTypeOf(value, "Array");
    }

    static isObject<T extends Object>(value: T): boolean {
        return this.isTypeOf(value, "Object");
    }
}

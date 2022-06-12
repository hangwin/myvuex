export function forEachValue<F = any, T extends { [key: string]: any} = any>(obj?: T, fn?: (key: string, value: F) => void) {
    obj && Object.keys(obj).forEach(key => fn && fn(key, obj[key]));
}

export function assert(condition: boolean, msg: string) {
    if (!condition) throw new Error(`[mvuex]: ${msg}`);
}

export function isPromise(val: any): boolean {
    return val && typeof val.then === 'function';
}

export function partial(fn: (...args: any[]) => any, ...args: any[]) {
    return function() {
        return fn(args);
    }
}
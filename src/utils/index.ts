import { watch } from 'vue';
export function isObject(obj: any) {
    return typeof obj === 'object' && obj !== null;
}
export function convertStateToTree(state: any, cb: any = () => null, path: string[] = []) {
    const res: any[] = [];
    Object.keys(state).forEach(key => {
        const item: any = {};
        item.title = key;
        item.key = key;
        res.push(item);
        if (isObject(state[key])) {
            item.children = [];
            Array.prototype.push.apply(item.children, convertStateToTree(state[key], cb, path.concat(key)));
        } else {
            item.val = state[key];
            item.path = path.concat(key);
            watch(() => state[key], (oldVal, newVal) => {
                if (newVal !== oldVal) {
                    cb && cb(path.concat(key), oldVal, newVal);
                }
            });
        }
    });
    return res;
}
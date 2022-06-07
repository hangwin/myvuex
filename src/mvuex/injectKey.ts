import { inject } from "vue";

export const storeKey = 'mstore';

export function useStore(key?: symbol | string) {
    return inject(key || storeKey);
}
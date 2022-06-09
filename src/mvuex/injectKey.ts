import { inject } from "vue";
import { Store } from "./store";

export const storeKey = 'mstore';

export function useStore<S = any>(key?: symbol | string): Store<S> {
    return inject(key || storeKey) as Store<S>;
}
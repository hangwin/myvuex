/* eslint-disable @typescript-eslint/no-this-alias */
import { App, reactive } from "vue";
import { storeKey } from './injectKey';
import { assert, forEachValue, isPromise, partial } from "./util";
export type Mutation<S> = (state: S, payload?: any) => any;
export interface MutationTree<S> {
    [key: string]: Mutation<S>;
}
export type ActionContext<S, R> = {
    state: S;
    rootState: R;
    dispatch: Dispatch;
    commit: Commit;
}
export type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any
export interface ActionObject<S, R> {
    root?: boolean;
    handler: ActionHandler<S, R>;
}
export type Actions<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export interface ActionTree<S, R> {
    [key: string]: Actions<S, R>
}
export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
export interface GetterTree<S, R> {
    [key: string]: Getter<S, R>;
}
export interface Module<S, R> {
    namespaced?: boolean;
    state?: S | (() => S);
    mutations?: MutationTree<S>;
    actions?: ActionTree<S, R>;
    getters?: GetterTree<S, R>;
    modules?: ModuleTree<R>;
}
export interface ModuleTree<R> {
    [key: string]: Module<any, R>;
}
export interface StoreOptions<S> {
    state?: S | (() => S);
    mutations?: MutationTree<S>;
    actions?: ActionTree<S, S>;
    getters?: GetterTree<S, S>;
    modules?: ModuleTree<S>;
}

export interface DispatchOptions {
    root?: boolean;
}
export interface CommitOptions {
    silent?: boolean;
    root?: boolean;
}
export interface Payload {
    type: string;
}

export function createStore<S>(options: StoreOptions<S>) {
    return new Store(options);
}

export interface Dispatch {
    <P extends Payload>(type: P, options?: DispatchOptions): Promise<any>;
    (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
}
export interface Commit {
    <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
    (type: string, payload?: any, options?: CommitOptions): void;
}
export class Store<S> {
    private _actions: {
        [key: string]: ((payload?: any) => any)[];
    };
    private _mutations: {
        [key: string]: ((payload?: any) => any)[];
    };
    private _state: any;
    private _wrappedGetters: any;
    getters: any;
    constructor(options: StoreOptions<S>) {
        console.log('mvuex..', options);
        this._actions = Object.create(null);
        this._mutations = Object.create(null);
        this._wrappedGetters = Object.create(null);
        this.dispatch = this.dispatch.bind(this);
        this.commit = this.commit.bind(this);
        forEachValue<Mutation<S>>(options.mutations, (key, value) => {
            this.registerMutation(key, value);
        });
        forEachValue<ActionHandler<S, S>>(options.actions, (key, value) => {
            this.registerAction(key, value);
        })
        forEachValue(options.getters, (key, value) => {
            this.registerGetter(key, value);
        });
        resetStoreState(this, options.state);
    }
    get state():S {
        return this._state.data;
    }
    set state(v: any) {
        if (__DEV__) {
            assert(false, `请直接使用store.replaceState()来替换store的state`);
        }
    }
    install(app: App, injectKey?: symbol | string) {
        app.provide(injectKey || storeKey, this);
        app.config.globalProperties.$store = this;
    }
    
    dispatch<P extends Payload>(type: string | P, payload?: any, options?: DispatchOptions): Promise<any> {
        if (typeof type === 'object' && type.type) {
            options = payload;
            payload = type;
            type = type.type;
        }
        const entry = this._actions[type as string];
        if (!entry) {
            if (__DEV__) {
                console.error(`[mvuex] 非法的action类型：${type}`);
            }
        }
        const result = entry.length > 1 ? Promise.all(entry.map(handler => handler(payload))) : entry[0](payload);
        console.log(type, payload, options);
        return new Promise((resolve) => {
            result.then((res: any) => {
                resolve(res);
            });
        });
    }
    commit<P extends Payload>(type: string | P, payload?: any, options?: CommitOptions) {
        if (typeof type === 'object' && type.type) {
            options = payload;
            payload = type;
            type = type.type;
        }
        const entry = this._mutations[type as string];
        if (!entry) {
            if (__DEV__) {
                console.error(`[mvuex] 非法的mutation类型：${type}`);
            }
        }
        entry.forEach(handler => {
            handler(payload);
        });
    }
    registerMutation<S>(type: string, handler: Mutation<S>) {
        const entry = this._mutations[type] = this._mutations[type] || [];
        entry.push((payload?: any) => {
            handler.call(this, this.state as unknown as S, payload);
        })
    }
    registerAction<S>(type: string, handler: ActionHandler<S, S>) {
        const entry = this._actions[type] = this._actions[type] || [];
        entry.push((payload?: any) => {
            let res = handler.call(this as unknown as Store<S>, {
                dispatch: this.dispatch,
                commit: this.commit,
                state: this.state as unknown as S,
                rootState: this.state as unknown as S,
            }, payload);
            if (!isPromise(res)) {
                res = Promise.resolve(res);
            }
            return res;
        })
    }
    registerGetter<S>(type: string, rawGetter: Getter<S, S>) {
        if (this._wrappedGetters[type]) {
            if (__DEV__) {
                console.error(`[mvuex] getter的key重复了：${type}`);
            }
            return;
        }
        this._wrappedGetters[type] = (store: Store<S>) => {
            return rawGetter(this.state as unknown as S, this.getters, store.state as unknown as S, store.getters);
        }
    }
}

// 用于对state的数据进行响应式处理
function resetStoreState(store: any, state: any) {
    store.getters = {};
    const wrappedGetters = store._wrappedGetters;
    const computedObj: any = {};
    forEachValue(wrappedGetters, (key, value) => {
        // rootStore传给getter
        computedObj[key] = partial(value, store);
        Object.defineProperty(store.getters, key, {
            get() {
                console.log('getgetters', computedObj[key]());
                return computedObj[key]();
            },
            enumerable: true,
        })
    });
    store._state = reactive({
        data: state,
    });
}
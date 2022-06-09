/* eslint-disable @typescript-eslint/no-this-alias */
import { assert } from ".pnpm/@vue+compiler-core@3.2.37/node_modules/@vue/compiler-core";
import { App, reactive } from "vue";
import { storeKey } from './injectKey';
export type Mutation<S> = (state: S, payload?: any) => any;
export interface MutationTree<S> {
    [key: string]: Mutation<S>;
}
export type ActionContext<S, R> = {
    state: S;
    rootState: R;
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
export class Store<S> {
    private _actions: any;
    private _mutations: any;
    private _state: any;
    constructor(options: StoreOptions<S>) {
        console.log('mvuex..', options);
        this._actions = Object.create(null);
        this._mutations = Object.create(null);
        this.dispatch = this.dispatch.bind(this);
        this.commit = this.commit.bind(this);
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
    dispatch<P extends Payload>(type: P, options?: DispatchOptions): Promise<any>;
    dispatch(type: string, payload?: any, options?: DispatchOptions): Promise<any>;
    dispatch<P extends Payload>(type: string | P, payload?: any, options?: DispatchOptions): Promise<any> {
        if (typeof type === 'object' && type.type) {
            options = payload;
            payload = type;
            type = type.type;
        }
        console.log(type, payload, options);
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    commit<P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
    commit(type: string, payload?: any, options?: CommitOptions): void;
    commit<P extends Payload>(type: string | P, payload?: any, options?: CommitOptions) {
        if (typeof type === 'object' && type.type) {
            options = payload;
            payload = type;
            type = type.type;
        }
    }
}

// 用于对state的数据进行响应式处理
function resetStoreState(store: any, state: any, hot?: boolean) {
    const oldState = store._state;
    store._state = reactive({
        data: state,
    });
}
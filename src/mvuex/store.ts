import { App } from "vue";
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
export function createStore<S>(options: StoreOptions<S>) {
    return new Store(options);
}
export class Store<S> {
    private _actions: any;
    private _mutations: any;
    constructor(options: StoreOptions<S>) {
        console.log('mvuex..', options);
        this._actions = Object.create(null);
        this._mutations = Object.create(null);
    }
    install(app: App, injectKey?: symbol | string) {
        app.provide(injectKey || storeKey, this);
    }
    // dispatch() {}
    // commit() {}
}
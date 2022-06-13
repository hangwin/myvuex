import { forEachValue } from "../util";

export default class Module {
    runtime: boolean;
    private _rawModule: any;
    private _children: any;
    state: any;
    context: any;
    constructor(rawModule: any, runtime: boolean) {
        this.runtime = runtime;
        // 原始模块
        this._rawModule = rawModule;
        this._children = Object.create(null);
        const rawState = rawModule.state;
        this.state = typeof rawState === 'function' ? rawState() : rawState;
    }
    getChild(key: string): Module {
        return this._children[key];
    }
    addChild(key: string, module: any) {
        this._children[key] = module;
    }
    removeChild(key: string) {
        delete this._children[key];
    }
    // 是否设置了命名空间标识
    get namespaced() {
        return !!this._rawModule.namespaced;
    }
    forEachMutation(fn: (...args: any[]) => any) {
        if (this._rawModule.mutations) {
            forEachValue(this._rawModule.mutations, fn);
        }
    }
    forEachAction(fn: (...args: any[]) => any) {
        if (this._rawModule.actions) {
            forEachValue(this._rawModule.actions, fn);
        }
    }
    forEachGetter(fn: (...args: any[]) => any) {
        if (this._rawModule.getters) {
            forEachValue(this._rawModule.getters, fn);
        }
    }
    forEachChild(fn: (...args: any[]) => any) {
        if (this._children) {
            forEachValue(this._children, fn);
        }
    }
}
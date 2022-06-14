/* eslint-disable @typescript-eslint/no-this-alias */
import { App, reactive } from "vue";
import { storeKey } from './injectKey';
import ModuleCollection from "./module/module-collection";
import MModule from './module/module';
import { assert, forEachValue, isPromise, partial } from "./util";
export interface MutationTree<S> {
    [key: string]: Mutation<S>;
}
export type ActionContext<S, R> = {
    state?: S;
    rootState?: R;
    dispatch: Dispatch;
    commit: Commit;
    getters?: any;
    rootGetters?: any;
}
export type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any
export interface ActionObject<S, R> {
    root?: boolean;
    handler: ActionHandler<S, R>;
}
export type Actions<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export type Getter<S, R> = (state: S, getters: any, rootState: R, rootGetters: any) => any;
export type Mutation<S> = (state: S, payload?: any) => any;
export type Plugin<S> = (store: Store<S>) => any
export interface ActionTree<S, R> {
    [key: string]: Actions<S, R>
}

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
    strict?: false,
    plugins?: Plugin<S>[];
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
    [key: string]: any;
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
    private _modules: ModuleCollection;
    strict: boolean | undefined;
    private _moduleNamespaceMap: any;
    private _committing: any;
    private _makeLocalGettersCache: any;
    private _subscribers: any[];
    private _actionSubscribers: any[];
    lastGetGetterKey: string | any;
    constructor(options: StoreOptions<S>) {
        console.log('mvuex..', options);
        const { plugins = [], strict } = options;
        this._actions = Object.create(null);
        this._mutations = Object.create(null);
        this._wrappedGetters = Object.create(null);
        this._modules = new ModuleCollection(options);
        // 用于保存设置了命名空间的模块
        this._moduleNamespaceMap = Object.create(null);
        this._makeLocalGettersCache = Object.create(null);
        this._subscribers = [];
        this._actionSubscribers = [];
        this.dispatch = this.dispatch.bind(this);
        this.commit = this.commit.bind(this);

        this.strict = strict;
        const state = this._modules.root?.state;
        this.installModule(state, [], this._modules.root!);
        resetStoreState(this, options.state);
        plugins.forEach(plugin => plugin(this));
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
    
    dispatch(type: string | Payload, payload?: any, options?: DispatchOptions): Promise<any> {
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
        try {
            this._actionSubscribers
                .slice()
                .filter((sub: any) => sub.before)
                .forEach((sub: any) => sub.before({ type, payload }, this.state));            
        } catch (error) {
            if (__DEV__) {
                console.warn(`[mvuex] 前置action订阅者执行出错`);
                console.error(error);
            }
        }
        const result = entry.length > 1 ? Promise.all(entry.map(handler => handler(payload))) : entry[0](payload);
        console.log(type, payload, options);
        return new Promise((resolve, reject) => {
            result.then((res: any) => {
                try {
                    this._actionSubscribers
                        .filter((sub: any) => sub.after)
                        .forEach((sub: any) => sub.after({ type, payload}, this.state));
                } catch (error) {
                    if (__DEV__) {
                        console.warn(`[mvuex] 后置action订阅者执行出错`);
                        console.error(error);
                    }
                }
                resolve(res);
            }, (error: any) => {
                try {
                    this._actionSubscribers
                        .filter((sub: any) => sub.error)
                        .forEach((sub: any) => sub.error({ type, payload }, this.state ));
                } catch (error) {
                    if (__DEV__) {
                        console.warn(`[mvuex] 错误action订阅者执行出错`);
                        console.error(error);
                    }
                }
                reject(error)
            });
        });
    }
    commit(type: string | Payload, payload?: any, options?: CommitOptions) {
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
        this._withCommit(() => {
            entry.forEach(handler => {
                handler(payload);
            });
        });
        this._subscribers.slice().forEach((sub: any) => sub({ type, payload}, this.state));
    }
    _withCommit(fn: (...args: any[]) => any) {
        const committing = this._committing;
        this._committing = true;
        fn();
        this._committing = committing;
    }
    registerMutation<S>(type: string, handler: Mutation<S>, local: ActionContext<S, S>) {
        const entry = this._mutations[type] = this._mutations[type] || [];
        entry.push((payload?: any) => {
            handler.call(this, local.state!, payload);
        })
    }
    registerAction<S>(type: string, handler: ActionHandler<S, S>, local: ActionContext<S, S>) {
        const entry = this._actions[type] = this._actions[type] || [];
        entry.push((payload?: any) => {
            let res = handler.call(this as unknown as Store<S>, {
                dispatch: local.dispatch,
                commit: local.commit,
                state: local.state,
                rootState: local.state,
                getters: local.getters,
                rootGetters: local.getters
            }, payload);
            if (!isPromise(res)) {
                res = Promise.resolve(res);
            }
            return res;
        })
    }
    registerGetter<S>(type: string, rawGetter: Getter<S, S>, local: ActionContext<S, S>) {
        if (this._wrappedGetters[type]) {
            if (__DEV__) {
                console.error(`[mvuex] getter的key重复了：${type}`);
            }
            return;
        }
        this._wrappedGetters[type] = (store: Store<S>) => {
            return rawGetter(local.state!, local.getters, store.state, store.getters);
        }
    }
    installModule<S>(rootState: S, path: string[], module: MModule, hot?: boolean) {
        const isRoot = path.length === 0;
        const namespace = this._modules.getNamespace(path);
        // 模块设置了命名空间, 则根据路径名来保存命名空间
        if (module.namespaced) {
            if (this._moduleNamespaceMap[namespace] && __DEV__) {
                console.error(`[mvuex] 模块的命名空间 ${namespace} 重复了`);
            }
            this._moduleNamespaceMap[namespace] = module;
    
        }
        // 非根模块，且不是动态注册的
        if (!isRoot && !hot) {
            const parentState = getNestedState(rootState, path.slice(0, -1));
            const moduleName = path[path.length - 1];
            this._withCommit(() => {
                if (__DEV__) {
                    if (moduleName in parentState) {
                        console.warn(`[mvuex] state的字段 "${moduleName}" 被同名的模块"${path.join('.')}"覆盖了`);
                    }
                }
                // 子模块名与父state字段名重名的话，会覆盖父模块
                parentState[moduleName] = module.state;
            });
        }
        // 局部状态对象
        const local = module.context = this.makeLocalContext(namespace, path);
        module.forEachMutation((key, value) => {
            // moduleA/xxx
            const namespacedType = namespace + key;
            this.registerMutation(namespacedType, value, local);
        });
        module.forEachAction((key, value) => {
            // 如果设置了root属性，则将这个action放到全局
            const type = value.root ? key : namespace + key;
            const handler = value.handler || value;
            this.registerAction(type, handler, local)

        });
        module.forEachGetter((key, value) => {
            const namespacedType = namespace + key;
            this.registerGetter(namespacedType, value, local);
        })
        module.forEachChild((key, value) => {
            this.installModule(rootState, path.concat(key), value, hot);
        })
    }
    // 为模块创建局部状态对象，里面包含dispatch commit state getters
    makeLocalContext(namespace: string, path: string[]) {
        const noNamespace = namespace === '';
        const store = this;
        const local = {
            dispatch: noNamespace ? store.dispatch : (_type: string | Payload, _payload?: any, _options?: any) => {
                let type = '';
                if (typeof _type === 'object' && _type.type) {
                    _options = _payload;
                    _payload = _type;
                    type = _type = _type.type;
                }
                if (!_options || !_options.root) {
                    _type = namespace + _type;
                    if (__DEV__ && !store._actions[_type]) {
                        console.error(`[mvuex] 未知的模块action类型：${_type}, 全局类型：${type}`);
                    }
                }
                return store.dispatch(_type, _payload);
            },
            commit: noNamespace ? store.commit : (_type: string | Payload, _payload?: any, _options?: any) => {
                let type = '';
                if (typeof _type === 'object' && _type.type) {
                    _options = _payload;
                    _payload = _type;
                    type = _type = _type.type;
                }
                if (!_options || !_options.root) {
                    _type = namespace + _type;
                    if (__DEV__ && !store._actions[_type]) {
                        console.error(`[mvuex] 未知的模块mutation类型：${_type}, 全局类型：${type}`);
                    }
                }
                return store.commit(_type, _payload, _options);
            }
        };

        Object.defineProperties(local, {
            getters: {
                get: noNamespace
                        ? () => {
                            return store.getters;
                        }
                        : () => {
                            return store.makeLocalGetters(namespace)
                        }
                },
                state: {
                    // 根据当前路径获取局部状态对象的state
                    get: () => getNestedState(store.state, path),
                },
            }
        );
        return local;
    }
    makeLocalGetters(namespace: string) {
        const store = this;
        if (!this._makeLocalGettersCache[namespace]) {
            const gettersProxy = {};
            const splitPos = namespace.length;
            // eg: namespace: 'moduleA/' type: 'moduleA/getXXX' 得出localType: getXXX
            Object.keys(this.getters).forEach(type => {
                if (type.slice(0, splitPos) !== namespace) return;
                const localType = type.slice(splitPos);
                Object.defineProperty(gettersProxy, localType, {
                    get: () => store.getters[type],
                    enumerable: true,
                });
            });
            store._makeLocalGettersCache[namespace] = gettersProxy;
        }
        return this._makeLocalGettersCache[namespace];
    }
    subscribe(fn: (...args: any[]) => any, options?: any) {
       return genericSubscribe(fn, this._subscribers, options)
    }
    subscribeAction(fn: any, options?: any) {
        const subs = typeof fn === 'function' ? { before: fn }: fn;
        return genericSubscribe(subs, this._actionSubscribers, options);
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
                store.lastGetGetterKey = key;
                return computedObj[key]();
            },
            enumerable: true,
        })
    });
    store._state = reactive({
        data: state,
    });
}

function getNestedState(state: any, path: string[]) {
    return path.reduce((pre, cur) => {
        return pre[cur];
    }, state);
}

function genericSubscribe(fn: (...args: any[]) => any, subs: any[], options: any) {
    if (subs.indexOf(fn) < 0) {
        options && options.prepend
            ? subs.unshift(fn)
            : subs.push(fn)
    }
    // 取消订阅
    return () => {
        const i = subs.indexOf(fn);
        if (i > -1) {
            subs.splice(i, 1);
        }
    }
}

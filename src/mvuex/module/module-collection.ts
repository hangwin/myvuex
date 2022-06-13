import { forEachValue } from "../util";
import Module from "./module";

// 构建出一颗模块树
export default class ModuleCollection {
    root: Module | undefined;
    // 原始根模块
    constructor(rawRootModule: any) {
        this.register([], rawRootModule, false);
    }
    register(path: string[], rawModule: any, runtime = true) {
        const newModule = new Module(rawModule, runtime);
        if (path.length === 0) {
            // 根模块
            this.root = newModule;
        } else {
            // 获取父级模块 路径要把自己截掉
            const parent = this.get(path.slice(0, -1));
            parent.addChild(path[path.length - 1], newModule);
        }
        // 递归注册嵌套的子模块
        if (rawModule.modules) {
            forEachValue(rawModule.modules, (key, module) => {
                this.register(path.concat(key), module, runtime);
            })
        }
    }
    unregister(path: string[]) {
        const parent = this.get(path.slice(0, -1));
        const key = path[path.length - 1];
        const child = parent.getChild(key);
        if (!child) {
            if (__DEV__) {
                console.warn(`[mvuex] 尝试去移除一个尚未注册的模块 ${key}`);
            }
            return;
        }
        if (!child.runtime) {
            return;
        }
        parent.removeChild(key);
    }
    // 根据路径获取模块[a, b, c] => a.b.c
    get(path: string[]): Module {
        return path.reduce((pre, cur) => {
            return pre?.getChild(cur);
        }, this.root) as Module;
    }
    getNamespace(path: string[]) {
        let module = this.root!;
        return path.reduce((pre, cur) => {
            module = module.getChild(cur);
            return pre + (module.namespaced ? cur + '/' : '');   
        }, '');
    }
}
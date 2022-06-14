<template>
  <div class="container">
    <div class="state">
       <a-tree
        :show-line="showLine"
        defaultExpandAll
        :tree-data="treeData"
        @select="onSelect"
      >
        <template #title="{ dataRef, isLeaf }">
          <div :class="{ curchangepath: dataRef?.path?.join('.') === changePath }">
            {{ isLeaf ? dataRef.key + ': ' + dataRef.val : dataRef.key }}
            {{ dataRef?.path?.join('.') === changePath ? ' &nbsp; &nbsp;<---' : ''}}
          </div>
        </template>
      </a-tree>
    </div>
   
    <div class="mutation">
       <a-list size="small" :data-source="mutations">
        <template #renderItem="{ item }">
          <a-list-item :class="{ curmutation: item === mutationType }">{{ item }} {{ item === mutationType ? ' &nbsp; &nbsp;<---' : '' }}</a-list-item>
        </template>
        <template #header>
          <div>Mutations</div>
        </template>
      </a-list>
    </div>
    <div class="actions">
       <a-list size="small" :data-source="actions">
        <template #renderItem="{ item }">
          <a-list-item :class="{ curaction: item === actionType }">{{ item }} {{ item === actionType ? ' &nbsp; &nbsp;<---' : '' }}</a-list-item>
        </template>
        <template #header>
          <div>Actions</div>
        </template>
      </a-list>
    </div>
    <div class="getters">
       <a-list size="small" :data-source="getters">
        <template #renderItem="{ item }">
          <a-list-item :class="{ curaction: item + counter === lastGetterKey }">{{ item }}: {{ getGetterValue(item) }}</a-list-item>
        </template>
        <template #header>
          <div>Getters</div>
        </template>
      </a-list>
    </div>
  </div>
</template>
<script lang="ts">
import { Tree, List, ListItem } from 'ant-design-vue';
import type { TreeProps } from 'ant-design-vue';
import { defineComponent, ref } from 'vue';
import { useStore } from '../mvuex';
import { convertStateToTree } from '../utils';
import { computed } from 'vue';
export default defineComponent({
  components: {
    'a-tree': Tree,
    'a-list': List,
    'a-list-item': ListItem,
  },
  setup() {
    const showLine = ref<boolean>(true);
    const store = useStore();
    const mutationType = ref('');
    const actionType = ref('');
    const changePath = ref('');
    let afterAction = false;
    const counter = ref(0);
    store.subscribe((mutation: any, state: any) => {
      if (!afterAction) {
        actionType.value = '';
      } else {
        afterAction = false;
      }
      mutationType.value = mutation.type;
      counter.value++;
    });
    store.subscribeAction((action: any, state: any) => {
      afterAction = true;
      mutationType.value = '';
      actionType.value = action.type;
    });
    const vuexStateChange = (path: string[], oldVal: any, newVal: any) => {
      console.log(path, oldVal, newVal);
      changePath.value = path.join('.');
    };
    const stateToTree = computed(() => (convertStateToTree(store.state, vuexStateChange)));
    const mutations = (store as any)._mutations;
    const actions = (store as any)._actions;
    const getters = store.getters;
    const treeData = ref<TreeProps['treeData']>(stateToTree as any);
    const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
      console.log('selected', selectedKeys, info);
    };
    const getGetterValue = (key: string) => store.getters[key];
    const lastGetterKey = computed(() => {
      return store.lastGetGetterKey + counter.value;
    });
    return {
      showLine,
      onSelect,
      treeData,
      mutations: Object.keys(mutations),
      actions: Object.keys(actions),
      getters: Object.keys(getters),
      mutationType,
      actionType,
      changePath,
      getGetterValue,
      lastGetterKey,
      counter,
    };
  },
});
</script>
<style scoped>
.container {
  display: flex;
  flex: 1;
}
.state {
  flex: 1;
  margin: 2px;
  margin-top: 26px;
}
.mutation {
  flex: 1;
  margin: 2px;
}
.actions {
  flex: 1;
  margin: 2px;
}
.getters {
  flex: 1;
  margin: 2px;
}
.curmutation {
  background-color: #cbe6ff;
  animation: changeColor 1.5s 2;
}
.curaction {
  background-color: #cbe6ff;
  animation: changeColor 1.5s 2;
}
.curchangepath {
  background-color: #cbe6ff;
  animation: changeColor 1.5s 2;
}
@keyframes changeColor {
      0% {
        opacity: 0;
      }
      10% {
        opacity: 0.2;
      }
      90% {
        opacity: 0.8;
      }
      100% {
        opacity: 1;
      }
  }
</style>


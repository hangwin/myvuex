<template>
  <div class="hello">
    <h1>自己的vuex</h1>
    <hr/>
    <h2>用户信息：{{ userInfo.name }}-{{ userInfo.age }}-{{ userInfo.money }}</h2>
    <h2>getter: {{ moneyPlus }}</h2>
    <button @click="addMoney">加钱</button>
    <button @click="addMoneyAsync">异步加钱</button>
    <button @click="addJobMoney">addJobMoney</button>
    <button @click="addJobMoneyAsync">addJobMoneyAsync</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from '../mvuex';
export default defineComponent({
  name: 'HelloWorldMVuex',
  props: {
    msg: String,
  },
  setup() {
    const store = useStore();
    console.log('useStore', store);
    const addMoney = () => {
      store.commit('addMoney');
    }
    const addMoneyAsync = () => {
      store.dispatch('addMoneyAsync', 1);
    }
    const addJobMoney = () => {
      store.commit('job/addMoney', 1);
    }
    const addJobMoneyAsync = () => {
      store.dispatch('job/addMoneyAsync', 1);
    }
    return {
      userInfo: store.state.userInfo,
      addMoney,
      addMoneyAsync,
      same: store.state.same,
      moneyPlus: computed(() => store.getters['getMoneyPlus']),
      addJobMoney,
      addJobMoneyAsync
    }
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

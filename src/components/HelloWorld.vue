<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <hr/>
    <h2>用户信息：{{ userInfo.name }}-{{ userInfo.age }}-{{ userInfo.money }}</h2>
    <h2>getter: {{ moneyPlus }}</h2>
    <button @click="addMoney">加钱</button>
    <button @click="addMoneyAsync">异步加钱</button>
    {{ same }}
  </div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { useStore } from 'vuex';
export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: String,
  },
  setup() {
    const store = useStore();
    const addMoney = () => {
      store.commit('addMoney');
      //store.state.userInfo.money ++;
    }
    const addMoneyAsync = () => {
      store.dispatch('addMoneyAsync');
    }
    return {
      userInfo: store.state.userInfo,
      same: store.state.same,
      addMoney,
      addMoneyAsync,
      moneyPlus: computed(() => store.getters['getMoneyPlus']),
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

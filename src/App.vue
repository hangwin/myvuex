<template>
  <img alt="Vue logo" src="./assets/logo.png">
  <HelloWorld msg="Welcome to Your Vue.js + TypeScript App"/>
  <hr>
  <HelloWorldMVuex />
  <VisualizeVuex />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import HelloWorld from './components/HelloWorld.vue';
import HelloWorldMVuex from './components/HelloWorldWithMVuex.vue';
import VisualizeVuex from './components/VisualizeVuex.vue';
export default defineComponent({
  name: 'App',
  components: {
    HelloWorld,
    HelloWorldMVuex,
    VisualizeVuex,
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

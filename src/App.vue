<template>
  <div>
    <section class="admin-navigation" v-if="appStore.isConnected">
      <ul>
        <li @click="goToView('/home')">Tabele</li>
        <li @click="goToView('/service')">Cereri Service</li>
      </ul>
    </section>
    <main>
      <router-view />
    </main>
  </div>
</template>
<script setup>
import { watchEffect } from 'vue';
import router from './router';
import { useAppStore } from './store/app.store';
const appStore = useAppStore()
const goToView = (path) => {
  router.push({path: path})
}

watchEffect(() => {
  console.log(appStore.isConnected)
})

</script>
<style lang="scss">
.admin-navigation {
  width: 100%;
  ul {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  li {
    width: 50%;
    background: var(--blue-800);
    padding: 0.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.1s ease-in-out;
    &:hover {
      background: var(--blue-300);
      a {
        color: var(--blue-800);
      }
    }
    &:active{
      box-shadow: inset 0px 0px 2px 1px #000
    }
  }
  li:first-child {
    border-right: 1px solid #fff;
  }
  a {
    color: var(--primary-color);
    text-decoration: none;
  }
}
</style>
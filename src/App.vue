<template>
  <div>
    <section class="admin-navigation" v-if="appStore.isConnected">
      <ul>
        <li class="admin-link active-admin-link" data-path="/home" @click="goToView">
          <i class="pi pi-table"></i> Tabele
        </li>
        <li class="admin-link" data-path="/service" @click="goToView">
          <i class="pi pi-file"></i>Cereri Service
        </li>
      </ul>
    </section>
    <main>
      <router-view />
    </main>
  </div>
</template>
<script setup>
import { watchEffect } from "vue";
import router from "./router";
import { useAppStore } from "./store/app.store";
const appStore = useAppStore();
const goToView = function (e) {
  const links = document.querySelectorAll(".admin-link");
  for (const link of links) {
    link.classList.remove("active-admin-link");
  }
  e.target.classList.add("active-admin-link");
  const path = e.target.dataset.path;

  router.push({ path: path });
};

watchEffect(() => {
  console.log(appStore.isConnected);
});
</script>
<style lang="scss">
.admin-navigation {
  width: 100%;
  ul {
    display: flex;
    flex-flow: row nowrap;
    list-style: none;
    margin: 0;
    padding: 0.25rem 0.5rem 0 0.5rem;
    background: var(--surface-50);
  }
  li {
    padding: 0.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.1s ease-in-out;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.5rem;
    background: var(--surface-200);
    position: relative;
    border-top-right-radius: 30px;
    border-top-left-radius: 10px;
    z-index: 1;
    &::after{
      position: absolute;
      bottom: 0px;
      width: 20px;
      height: 20px;
      content: " ";
    }

    &::after {
      right: -19px;
      border-bottom-left-radius: 20px;
      border-width: 0 0 1px 1px;
      box-shadow: -6px 6px 0 var(--surface-200);
    }

    &:hover {
      background: var(--surface-200);
      a {
        color: var(--blue-800);
      }
    }
  }
  a {
    color: var(--primary-color);
    text-decoration: none;
  }
}

.active-admin-link {
  background: var(--primary-color) !important;
  z-index: 2 !important;
  &::after {
    box-shadow: -6px 6px 0 var(--primary-color) !important;
  }
}
main{
  position: relative;
  z-index: 2;
}
</style>
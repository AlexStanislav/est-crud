<template>
  <div class="login-view">
    <Card>
      <h1>Login</h1>
      <template #content>
        <InputText type="text" placeholder="Connection String" v-model="connectionString" />
        <InputText type="text" placeholder="Database Name" v-model="databaseName" />
        <InputText type="text" placeholder="Username" v-model="username" />
        <InputText type="password" placeholder="Password" v-model="password" />
        <Button @click="connectToDB()">Connect</Button>
      </template>
    </Card>
  </div>
</template>
<script setup>
import InputText from "primevue/inputtext";
import Button from "primevue/button";
import Card from "primevue/card";
import { useAppStore } from "../store/app.store";
import { ref } from "vue";
import router from "../router/index.js";

const appStore = useAppStore();

const connectionString = ref("");
const username = ref("");
const password = ref("");
const databaseName = ref("");

const connectToDB = async () => {
  await appStore.connect({ username: username.value, password: password.value, host: connectionString.value, database: databaseName.value });
  router.push({ path: "/home" });
};
</script>
<style>
.login-view {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.p-card {
  width: 400px;
  border: 1px solid #3f3f46;
}

.p-card-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.p-button {
  width: 100%;
  text-align: center;
  border-radius: 5px;
}
</style>
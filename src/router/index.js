import { createRouter, createWebHistory } from "vue-router";
import { useAppStore } from "../store/app.store";

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: "/home",
            name: "Home",
            component: () => import("../views/HomeView.vue"),
        },
        {
            path: "/",
            name: "Login",
            component: () => import("../views/LoginView.vue"),
        },
        {
            path: "/service",
            name: "Service",
            component: () => import("../views/RequestsView.vue")
        }
    ],
})

router.beforeEach((to, from, next) => {
    const appStore = useAppStore()
    if (to.name !== "Login" && appStore.isConnected === false) {
        next({ name: "Login" })
    } else {
        next()
    }
})

export default router
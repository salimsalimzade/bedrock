import { createRouter } from "@solidjs/router";
import { lazy } from "solid-js";

export const Router = createRouter({
  routes: [
    { path: "/", component: lazy(() => import("./pages/home-page")) },
    { path: "/greetings", component: lazy(() => import("./pages/greetings-page")) },
    { path: "/users", component: lazy(() => import("./pages/users-page")) },
    { path: "*404", component: lazy(() => import("./pages/not-found-page")) },
  ],
});

export const { paths } = Router;

import * as About from "../viewpage/about_page.js";
import * as Home from "../viewpage/home_page.js";

export const routePath = {
  HOME: "/",
  ABOUT: "/about",
};

export const routes = [
  { path: routePath.HOME, page: Home.home_page },
  { path: routePath.ABOUT, page: About.about_page },
];

export function routing(pathname, href) {
  const route = routes.find((r) => r.path == pathname);
  if (route) route.page();
  else routes[0].page();
}

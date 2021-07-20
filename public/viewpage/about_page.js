import * as Element from "./element.js";
import * as Route from "../controller/route.js";
import * as Auth from "../controller/auth.js";

export function addEventListeners() {
  Element.menuAbout.addEventListener("click", () => {
    history.pushState(null, null, Route.routePath.ABOUT);
    about_page();
  });
}

export function about_page() {
  if (!Auth.currentUser) {
    Element.root.innerHTML = "<h1>Access not allowed.<h1>";
    return;
  }
  Element.root.innerHTML = "<h1>About Page</h1>";
}

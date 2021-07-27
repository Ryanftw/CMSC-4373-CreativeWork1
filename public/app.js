// console.log("app.js");
import * as Auth from "./controller/auth.js";
import * as Home from "./viewpage/home_page.js";
import * as About from "./viewpage/about_page.js";
import * as Route from "./controller/route.js";
import * as Search from "./viewpage/search_page.js";

Auth.addEventListeners();
Home.addEventListeners();
About.addEventListeners();
Search.addEventListeners();

window.onload = () => {
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  Route.routing(pathname, hash);
};

window.addEventListener("popstate", (e) => {
  e.preventDefault();
  const pathname = e.target.location.pathname;
  const hash = e.target.location.hash;
  Route.routing(pathname, hash);
});

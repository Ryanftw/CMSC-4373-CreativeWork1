import * as Element from "../viewpage/element.js";
import * as FirebaseController from "./firebase_controller.js";
import * as Constant from "../model/constant.js";
import * as Util from "../viewpage/util.js";
import * as Route from "./route.js";

export let currentUser;

export function addEventListeners() {
  Element.formSignin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
      await FirebaseController.signIn(email, password);
      Element.modalSigninForm.hide();
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info("Sign in Error", JSON.stringify(e), Element.modalSigninForm);
    }
  });

  Element.menuSignout.addEventListener("click", () => {
    try {
      FirebaseController.signOut();
    } catch (e) {
      console.log(e);
    }
  });

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // sign in
      currentUser = user;
      let elements = document.getElementsByClassName("modal-menus-pre-auth");
      for (let i = 0; i < elements.length; i++)
        elements[i].style.display = "none";
      elements = document.getElementsByClassName("modal-menus-post-auth");
      for (let i = 0; i < elements.length; i++)
        elements[i].style.display = "block";
      const pathname = window.location.pathname;
      const href = window.location.href;
      Route.routing(pathname, href);
    } else {
      // sign out
      currentUser = null;
      let elements = document.getElementsByClassName("modal-menus-pre-auth");
      for (let i = 0; i < elements.length; i++)
        elements[i].style.display = "block";
      elements = document.getElementsByClassName("modal-menus-post-auth");
      for (let i = 0; i < elements.length; i++)
        elements[i].style.display = "none";
      history.pushState(null, null, Route.routePath.HOME);
      Element.root.innerHTML = "<h1>Signed Out</h1>";
    }
  });
}

// Element.formSignin.addEventListener("submit", (e) => {
//   const email = e.target.email.value;
//   const password = e.target.password.value;
// });

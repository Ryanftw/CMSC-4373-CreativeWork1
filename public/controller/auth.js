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
      const hash = window.location.hash;
      Route.routing(pathname, hash);
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
      // Element.root.innerHTML = "<h1>Signed Out</h1>";
    }
  });
  Element.formCreateAccount.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const passwordConfirm = e.target.passwordConfirm.value;

    // reset error messages
    Element.formCreateAccountError.email.innerHTML = "";
    Element.formCreateAccountError.password.innerHTML = "";
    Element.formCreateAccountError.passwordConfirm.innerHTML = "";

    let valid = true;
    // email: HTML validation, xxx@uco.edu

    if (password.length < 6) {
      valid = false;
      Element.formCreateAccountError.password.innerHTML = "At least 6 chars";
    }
    if (passwordConfirm != password) {
      valid = false;
      Element.formCreateAccountError.passwordConfirm.innerHTML =
        "Passwords do not match";
    }

    if (!valid) return;

    try {
      await FirebaseController.createAccount(email, password);
      Util.info(
        "Account Created",
        "You are now signed in",
        Element.modalCreateAccount
      );
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info(
        "Failed to Create Account",
        JSON.stringify(e),
        Element.modalCreateAccount
      );
    }
  });
}

// Element.formSignin.addEventListener("submit", (e) => {
//   const email = e.target.email.value;
//   const password = e.target.password.value;
// });

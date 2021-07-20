// top menus
export const menuSignout = document.getElementById("menu-signout");
export const menuHome = document.getElementById("menu-home");
export const menuAbout = document.getElementById("menu-about");

// form
export const formSignin = document.getElementById("form-signin");
export const formCreateThread = document.getElementById("form-create-thread");

// main content root
export const root = document.getElementById("root");

// modal bootstrap object
export const modalSigninForm = new bootstrap.Modal(
  document.getElementById("modal-signin-form")
);

export const modalInfobox = new bootstrap.Modal(
  document.getElementById("modal-infobox")
);
export const modalInfoboxTitleElement = document.getElementById(
  "modal-infobox-title"
);
export const modalInfoboxBodyElement =
  document.getElementById("modal-infobox-body");

export const modalCreateThread = new bootstrap.Modal(
  document.getElementById("modal-create-thread")
);

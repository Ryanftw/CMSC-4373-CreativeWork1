import * as Element from "./element.js";

export function info(title, body, closeModal) {
  if (closeModal) {
    closeModal.hide();
  }
  Element.modalInfoboxTitleElement.innerHTML = title;
  Element.modalInfoboxBodyElement.innerHTML = body;
  Element.modalInfobox.show();
}

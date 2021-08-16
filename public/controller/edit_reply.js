import * as Element from "../viewpage/element.js";
import * as Constant from "../model/constant.js";
import * as Util from "../viewpage/util.js";
import * as FirebaseController from "./firebase_controller.js";

export function addEventListeners() {
  Element.formEditReply.form.addEventListener("submit", async (e) => {
    e.preventDefault();
  });
}

export async function edit_reply(docId) {
  let reply;
  try {
    reply = await FirebaseController.getReplyById(docId);
    if (!reply) {
      Util.info("getReplyById error", "No reply found by the id");
      return;
    }
  } catch (e) {
    if (Constant.DEV) console.log(e);
    Util.info("getReplyById Error", JSON.stringify(e));
    return;
  }

  // show product
  Element.formEditReply.reply.value = reply.content;

  Element.formEditReply.addEventListener("submit", async (e) => {
    e.preventDefault();
    reply.content = e.target.reply.value;
    await FirebaseController.updateReply(reply);
  });

  Element.modalEditReply.show();
}

// export async function delete_product(docId, imageName) {
//   try {
//     await FirebaseController.deleteProduct(docId, imageName);
//     // update browser
//     const cardTag = document.getElementById("card-" + docId);
//     cardTag.remove();

//     Util.info("Deleted!", `${docId} has been delete`);
//   } catch (e) {
//     if (Constant.DEV) console.log(e);
//     Util.info("Delete product error", JSON.stringify(e));
//   }
// }

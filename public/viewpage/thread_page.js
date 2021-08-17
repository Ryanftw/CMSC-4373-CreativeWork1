import * as Auth from "../controller/auth.js";
import * as Element from "./element.js";
import * as FirebaseController from "../controller/firebase_controller.js";
import * as Util from "./util.js";
import * as Constant from "../model/constant.js";
import { Reply } from "../model/reply.js";
import * as Route from "../controller/route.js";
import * as Edit from "../controller/edit_reply.js";

export function addViewButtonListeners() {
  const viewButtonForms = document.getElementsByClassName("thread-view-form");
  for (let i = 0; i < viewButtonForms.length; i++) {
    addViewFormSubmitEvent(viewButtonForms[i]);
  }
}

export function addViewFormSubmitEvent(form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = e.target.getElementsByTagName("button")[0];
    const label = Util.disableButton(button);
    // await Util.sleep(1000);
    const threadId = e.target.threadId.value;
    history.pushState(null, null, Route.routePath.THREAD + "#" + threadId);
    await thread_page(threadId);
    Util.enableButton(button, label);
  });
}

export async function thread_page(threadId) {
  if (!Auth.currentUser) {
    Element.root.innerHTML = "<h1> Protected Page </h1>";
    return;
  }

  if (!threadId) {
    Util.info("Error", "Thread Id is null; invalid access");
    return;
  }

  // 1. get thread from firestore by id
  // 2. get all replies to this thread
  // 3. display this thread
  // 4. display all reply message
  // 5. add a form for a new reply

  let thread;
  let replies = [];
  try {
    thread = await FirebaseController.getOneThread(threadId);
    if (!thread) {
      Util.info("Error", "Thread does not exist");
      return;
    }
    replies = await FirebaseController.getReplyList(threadId);
  } catch (e) {
    if (Constant.DEV) console.log(e);
    Util.info("Error", JSON.stringify(e));
    return;
  }

  let html = `
    <h4 class="bg-primary text-white">${thread.title}</h4>
    <div>${thread.email} (At ${new Date(thread.timestamp).toString()})</div>
    <div class="bg-secondary text-white">${thread.content}</div>
    <hr>
  `;

  html += '<div id="message-reply-body">';
  //display all replies
  if (replies && replies.length > 0) {
    replies.forEach((r) => {
      html += buildReplyView(r);
    });
  }
  html += "</div>";

  // add a reply
  html += `
  <div>
    <textarea id="textarea-add-new-reply" placeholder="Reply to this thread"></textarea>
    <br>
    <button id="button-add-new-reply" class="btn btn-outline-info">Post reply</button>
  </div>
  `;

  Element.root.innerHTML = html;

  const deleteForms = document.getElementsByClassName("form-delete-reply");
  for (let i = 0; i < deleteForms.length; i++) {
    deleteForms[i].addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = e.target.getElementsByTagName("button")[0];
      const label = Util.disableButton(button);
      let docId = e.target.docId.value;
      try {
        await FirebaseController.deleteReply(docId);
        const replyBody = document.getElementById("message-reply-body");
        const deleteReply = replyBody.getElementsByClassName(
          "one-reply-" + docId
        )[0];
        Util.enableButton(button, label);
        deleteReply.remove();
        Util.info("Delete Success!", "Reply Deleted Successfully");
      } catch (e) {
        if (Constant.DEV) console.log(e);
      }
    });
  }

  const editForms = document.getElementsByClassName("form-edit-reply");
  for (let i = 0; i < editForms.length; i++) {
    editForms[i].addEventListener("submit", async (e) => {
      e.preventDefault();
      let docId = e.target.docId.value;
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

      Element.formEditReply.reply.value = reply.content;

      Element.formEditReply.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = e.target.getElementsByTagName("button")[0];
        const label = Util.disableButton(button);
        reply.content = e.target.reply.value;
        try {
          await FirebaseController.updateReply(reply);
          const replyBody = document.getElementById("message-reply-body");
          replyBody.getElementsByClassName(
            "reply-content-" + reply.docId
          )[0].innerHTML = reply.content;
          Util.enableButton(button, label);
          Util.info(
            "Update Success!",
            "Reply Updated Successfully",
            Element.modalEditReply
          );
        } catch (e) {
          if (Constant.DEV) console.log(e);
        }
      });

      Element.modalEditReply.show();
    });
  }

  document
    .getElementById("button-add-new-reply")
    .addEventListener("click", async () => {
      const content = document.getElementById("textarea-add-new-reply").value;
      const uid = Auth.currentUser.uid;
      const email = Auth.currentUser.email;
      const timestamp = Date.now();
      const reply = new Reply({
        uid,
        email,
        timestamp,
        content,
        threadId,
      });

      const button = document.getElementById("button-add-new-reply");
      const label = Util.disableButton(button);

      try {
        const docId = await FirebaseController.addReply(reply);
        reply.docId = docId;
      } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info("Error", JSON.stringify(e));
      }

      const replyTag = document.createElement("div");
      replyTag.innerHTML = buildReplyView(reply);
      document.getElementById("message-reply-body").appendChild(replyTag);
      document.getElementById("textarea-add-new-reply").value = "";

      editListener(reply);
      deleteListener(reply);

      // create listener for delete and edit here when a new reply is added

      Util.enableButton(button, label);
    });
}

function buildReplyView(reply) {
  let html = `
        <div class="one-reply-${reply.docId} border border-primary">
            <div class="bg-info text-white">
                Replied by ${reply.email} (At ${new Date(
    reply.timestamp
  ).toString()})
            </div>
            <div class="reply-content-${reply.docId}">${reply.content}</div>
            `;
  reply.uid == Auth.currentUser.uid
    ? (html += `<div>
              <form class="form-edit-reply" method="post" style="display: inline-block;">
                  <input type="hidden" name="docId" value="${reply.docId}">
                  <input type="hidden" name="reply" value="${reply.content}">
                  <button type="submit" class="btn btn-outline-primary">Edit</button>
              </form>
              <form class="form-delete-reply" method="post" style="display: inline-block;">
                  <input type="hidden" name="docId" value="${reply.docId}">
                  <button type="submit" class="btn btn-outline-danger">Delete</button>
              </form> 
            </div>
        </div>
        <hr>
    `)
    : (html += `</div></hr>`);

  return html;
}

function editListener(reply) {
  const editReply = document.getElementById("message-reply-body");
  editReply
    .getElementsByClassName("one-reply-" + reply.docId)[0]
    .getElementsByClassName("form-edit-reply")[0]
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      let docId = e.target.docId.value;
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

      Element.formEditReply.reply.value = reply.content;

      Element.formEditReply.addEventListener("submit", async (e) => {
        e.preventDefault();
        reply.content = e.target.reply.value;
        try {
          await FirebaseController.updateReply(reply);
          const replyBody = document.getElementById("message-reply-body");
          replyBody.getElementsByClassName(
            "reply-content-" + reply.docId
          )[0].innerHTML = reply.content;
          Util.info(
            "Update Success!",
            "Reply Updated Successfully",
            Element.modalEditReply
          );
        } catch (e) {
          if (Constant.DEV) console.log(e);
        }
      });

      Element.modalEditReply.show();
    });
}

function deleteListener(reply) {
  const deleteReply = document.getElementById("message-reply-body");
  deleteReply
    .getElementsByClassName("one-reply-" + reply.docId)[0]
    .getElementsByClassName("form-delete-reply")[0]
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      let docId = e.target.docId.value;
      try {
        await FirebaseController.deleteReply(docId);
        const replyBody = document.getElementById("message-reply-body");
        const deleteReply = replyBody.getElementsByClassName(
          "one-reply-" + docId
        )[0];
        deleteReply.remove();
        Util.info("Delete Success!", "Reply Deleted Successfully");
      } catch (e) {
        if (Constant.DEV) console.log(e);
      }
    });
}

import * as Element from "./element.js";
import * as Route from "../controller/route.js";
import * as Auth from "../controller/auth.js";
import { Thread } from "../model/thread.js";
import * as Constant from "../model/constant.js";
import * as FirebaseController from "../controller/firebase_controller.js";
import * as Util from "./util.js";
import * as ThreadPage from "./thread_page.js";

export function addEventListeners() {
  Element.menuHome.addEventListener("click", async () => {
    history.pushState(null, null, Route.routePath.HOME);
    const label = Util.disableButton(Element.menuHome);
    await home_page();
    // await Util.sleep(1000);
    Util.enableButton(Element.menuHome, label);
  });

  Element.formCreateThread.addEventListener("submit", async (e) => {
    e.preventDefault();

    const button = Element.formCreateThread.getElementsByTagName("button")[0]; // submit button for create thread element. there's only 1 button, create button, so it's easy.
    const label = Util.disableButton(button);
    // await Util.sleep(1000);

    Element.formCreateThreadError.title.innerHTML = "";
    Element.formCreateThreadError.content.innerHTML = "";
    Element.formCreateThreadError.keywords.innerHTML = "";

    const title = e.target.title.value.trim();
    const content = e.target.content.value.trim();
    const keywords = e.target.keywords.value.trim();
    const uid = Auth.currentUser.uid;
    const email = Auth.currentUser.email;
    const timestamp = Date.now();
    const keywordsArray = keywords.toLowerCase().match(/\S+/g);

    const thread = new Thread({
      uid,
      title,
      content,
      email,
      timestamp,
      keywordsArray,
    });

    //validate thread before storing in firebase
    let valid = true;
    let error = thread.validate_title();
    if (error) {
      valid = false;
      Element.formCreateThreadError.title.innerHTML = error;
    }
    error = thread.validate_keywords();
    if (error) {
      valid = false;
      Element.formCreateThreadError.keywords.innerHTML = error;
    }
    error = thread.validate_content();
    if (error) {
      valid = false;
      Element.formCreateThreadError.content.innerHTML = error;
    }

    if (!valid) {
      Util.enableButton(button, label);
      return;
    }

    try {
      const docId = await FirebaseController.addThread(thread);
      thread.docId = docId;
      // home_page(); // we will improve this later, this is a hotfix. Adds the new thread when you create one on the page.
      const trTag = document.createElement("tr"); // <tr></tr>
      trTag.innerHTML = buildThreadView(thread);
      const threadTableBody = document.getElementById("thread-table-body");
      threadTableBody.prepend(trTag);
      const viewForms = document.getElementsByClassName("thread-view-form");
      ThreadPage.addViewFormSubmitEvent(viewForms[0]);
      const noThreadFound = document.getElementById("no-thread-found");
      if (noThreadFound) {
        noThreadFound.innerHTML = "";
      }
      e.target.reset(); // clears the entries in the form

      Util.info(
        "Success",
        "A new thread has been added",
        Element.modalCreateThread
      );
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info("Failed to add", JSON.stringify(e), Element.modalCreateThread);
    }
    Util.enableButton(button, label);
    deleteThreadListener(thread);
    editThreadListener(thread);
  });
}

export async function home_page() {
  if (!Auth.currentUser) {
    Element.root.innerHTML = "<h1>Access not allowed.<h1>";
    return;
  }

  let threadList;
  try {
    threadList = await FirebaseController.getThreadList();
  } catch (e) {
    if (Constant.DEV) constole.log(e);
    Util.info("Error to get thread list", JSON.stringify(e));
  }

  buildHomeScreen(threadList);

  const table = document.getElementById("thread-table-body");
  const editButtons = table.getElementsByClassName("form-edit-thread");
  for (let i = 0; i < editButtons.length; i++) {
    editButtons[i].addEventListener("submit", async (e) => {
      e.preventDefault();
      const docId = e.target.docId.value;
      let thread;
      try {
        thread = await FirebaseController.getOneThread(docId);
        if (!thread) {
          Util.info("getThreadById error", "No thread found by the id");
          return;
        }
      } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info("getThreadById Error", JSON.stringify(e));
        return;
      }

      Element.formEditThreadError.title.innerHTML = "";
      Element.formEditThreadError.content.innerHTML = "";
      Element.formEditThreadError.keywords.innerHTML = "";

      Element.formEditThread.title.value = thread.title;
      Element.formEditThread.keywords.value = thread.keywordsArray;
      Element.formEditThread.content.value = thread.content;
      Element.modalEditThread.show();

      const keysArray = thread.keywordsArray;
      if (keysArray[0].includes(",")) {
        const keysArr = keysArray[0].replaceAll(",", " ");
        Element.formEditThread.keywords.value = keysArr;
      } else {
        Element.formEditThread.keywords.value = "";
        for (let i = 0; i < keysArray.length; i++) {
          Element.formEditThread.keywords.value += keysArray[i] + " ";
        }
      }

      Element.formEditThread.title.value = thread.title;
      Element.formEditThread.content.value = thread.content;
      Element.modalEditThread.show();

      Element.formEditThread.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = e.target.getElementsByTagName("button")[0];
        const label = Util.disableButton(button);
        thread.title = e.target.title.value;
        const keys = e.target.keywords.value.trim();
        thread.content = e.target.content.value;
        const keywordsArray = keys.toLowerCase().match(/\S+/g);
        thread.keywordsArray = keywordsArray;

        let keyStr = "";
        for (let i = 0; i < keywordsArray.length; i++) {
          keyStr += keywordsArray[i] + " ";
        }
        thread.keywordsArray = keywordsArray;

        let valid = true;
        let error = thread.validate_title();
        if (error) {
          valid = false;
          Element.formEditThreadError.title.innerHTML = error;
        }
        error = thread.validate_keywords();
        if (error) {
          valid = false;
          Element.formEditThreadError.keywords.innerHTML = error;
        }
        error = thread.validate_content();
        if (error) {
          valid = false;
          Element.formEditThreadError.content.innerHTML = error;
        }

        if (!valid) return;

        try {
          await FirebaseController.updateThread(thread);
          const tableThread = table.getElementsByClassName(
            "table-row-" + thread.docId //add docId to make each thread id unique
          )[0];
          tableThread.getElementsByClassName("edit-thread-title")[0].innerHTML =
            thread.title;
          tableThread.getElementsByClassName(
            "edit-thread-keywords"
          )[0].innerHTML = keyStr;
          tableThread.getElementsByClassName(
            "edit-thread-content"
          )[0].innerHTML = thread.content;
          Util.enableButton(button, label);
          Util.info(
            "Update Success!",
            "Thread Updated Successfully",
            Element.modalEditThread
          );
        } catch (e) {
          if (Constant.DEV) console.log(e);
        }
      });
    });
  }

  const deleteButtons = table.getElementsByClassName("form-delete-thread");
  for (let i = 0; i < deleteButtons.length; i++) {
    deleteButtons[i].addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = e.target.getElementsByTagName("button")[0];
      const label = Util.disableButton(button);
      let docId = e.target.docId.value;
      try {
        await FirebaseController.deleteThread(docId);
        const deleteReply = table.getElementsByClassName(
          "table-row-" + docId
        )[0];
        Util.enableButton(button, label);
        deleteReply.remove();
        Util.info("Delete Success!", "Thread Deleted Successfully");
      } catch (e) {
        if (Constant.DEV) console.log(e);
      }
    });
  }
}

export function buildHomeScreen(threadList) {
  let html = "";
  html += `
    <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modal-create-thread"
    >+ New Thread</button>
  `;

  html += `
    <table class="table table-striped">
    <thead>
        <tr>
        <th scope="col">Actions</th>
        <th scope="col">Title</th>
        <th scope="col">Keywords</th>
        <th scope="col">Posted By</th>
        <th scope="col">Content</th>
        <th scope="col">Posted At</th>
        </tr>
    </thead>
    <tbody id="thread-table-body">
  `;

  threadList.forEach((thread) => {
    html += `
        <tr class="table-row-${thread.docId}">
        ${buildThreadView(thread)}
        </tr>
      `;
  });

  html += "</tbody></table>";
  Element.root.innerHTML = html;

  if (threadList.length == 0) {
    html += '<h4 id="no-thread-found">No Threads Found</h4>';
    Element.root.innerHTML = html;
    return;
  }

  ThreadPage.addViewButtonListeners();
}

function buildThreadView(thread) {
  let html = `
        <td class="one-thread-${thread.docId}">
            <form method="post" class="thread-view-form"> 
              <input type="hidden" name="threadId" value="${thread.docId}">
              <button type="submit" class="btn btn-outline-primary">View</button>
            </form>
            `;
  Auth.currentUser.uid == thread.uid
    ? (html += `<form id="edit-thread-${
        thread.docId
      }" class="form-edit-thread" method="post">
                  <input type="hidden" name="docId" value="${thread.docId}">
                  <button type="submit" class="btn btn-outline-primary">Edit</button>
            </form>
            <form id="delete-thread-${
              thread.docId
            }" class="form-delete-thread" method="post">
                <input type="hidden" name="docId" value="${thread.docId}">
                <button type="submit" class="btn btn-outline-danger">Delete</button>
            </form>
        </td>
        <td id="one-title-${thread.docId}" class="edit-thread-title">${
        thread.title
      }</td>
        <td id="one-keywords-${thread.docId}" class="edit-thread-keywords">${
        !thread.keywordsArray || !Array.isArray(thread.keywordsArray)
          ? ""
          : thread.keywordsArray.join(" ")
      }</td>
        <td id="one-email-${thread.docId}" class="edit-thread-email">${
        thread.email
      }</td>
        <td id="one-content-${thread.docId}" class="edit-thread-content">${
        thread.content
      }</td>
        <td id="one-timestamp-${
          thread.docId
        }" class="delete-thread-timestamp">${new Date(
        thread.timestamp
      ).toString()}</td>

    `)
    : (html += `</td>
    <td class="edit-thread-title">${thread.title}</td>
    <td class="edit-thread-keywords">${
      !thread.keywordsArray || !Array.isArray(thread.keywordsArray)
        ? ""
        : thread.keywordsArray.join(" ")
    }</td>
    <td>${thread.email}</td>
    <td class="edit-thread-content">${thread.content}</td>
    <td>${new Date(thread.timestamp).toString()}</td>`);
  return html;
}

function editThreadListener(thread) {
  document
    .getElementById("edit-thread-" + thread.docId)
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const docId = e.target.docId.value;
      let thread;
      try {
        thread = await FirebaseController.getOneThread(docId);
        if (!thread) {
          Util.info("getThreadById error", "No thread found by the id");
          return;
        }
      } catch (e) {
        if (Constant.DEV) console.log(e);
        Util.info("getThreadById Error", JSON.stringify(e));
        return;
      }

      Element.formEditThreadError.title.innerHTML = "";
      Element.formEditThreadError.content.innerHTML = "";
      Element.formEditThreadError.keywords.innerHTML = "";

      const keysArray = thread.keywordsArray;
      if (keysArray[0].includes(",")) {
        const keysArr = keysArray[0].replaceAll(",", " ");
        Element.formEditThread.keywords.value = keysArr;
      } else {
        Element.formEditThread.keywords.value = "";
        for (let i = 0; i < keysArray.length; i++) {
          Element.formEditThread.keywords.value += keysArray[i] + " ";
        }
      }

      Element.formEditThread.title.value = thread.title;
      Element.formEditThread.content.value = thread.content;
      Element.modalEditThread.show();

      Element.formEditThread.addEventListener("submit", async (e) => {
        e.preventDefault();
        const button = e.target.getElementsByTagName("button")[0];
        const label = Util.disableButton(button);
        thread.title = e.target.title.value;
        const keys = e.target.keywords.value.trim();
        thread.content = e.target.content.value;
        const keywordsArray = keys.toLowerCase().match(/\S+/g);
        thread.keywordsArray = keywordsArray;

        let keyStr = "";
        for (let i = 0; i < keywordsArray.length; i++) {
          keyStr += keywordsArray[i] + " ";
        }
        thread.keywordsArray = keywordsArray;

        let valid = true;
        let error = thread.validate_title();
        if (error) {
          valid = false;
          Element.formEditThreadError.title.innerHTML = error;
        }
        error = thread.validate_keywords();
        if (error) {
          valid = false;
          Element.formEditThreadError.keywords.innerHTML = error;
        }
        error = thread.validate_content();
        if (error) {
          valid = false;
          Element.formEditThreadError.content.innerHTML = error;
        }

        if (!valid) return;

        try {
          await FirebaseController.updateThread(thread);
          document.getElementById("one-title-" + docId).innerHTML =
            thread.title;
          document.getElementById("one-keywords-" + docId).innerHTML = keyStr;
          document.getElementById("one-content-" + docId).innerHTML =
            thread.content;
          Util.enableButton(button, label);
          Util.info(
            "Update Success!",
            "Thread Updated Successfully",
            Element.modalEditThread
          );
        } catch (e) {
          if (Constant.DEV) console.log(e);
        }
      });

      Element.modalEditThread.show();
    });
}

function deleteThreadListener(thread) {
  const deleteThread = document.getElementById("delete-thread-" + thread.docId);
  deleteThread.addEventListener("submit", async (e) => {
    e.preventDefault();
    const button = e.target.getElementsByTagName("button")[0];
    const label = Util.disableButton(button);
    let docId = e.target.docId.value;
    try {
      await FirebaseController.deleteThread(docId);
      document.getElementsByClassName("one-thread-" + docId)[0].remove();
      document.getElementById("one-title-" + docId).remove();
      document.getElementById("one-keywords-" + docId).remove();
      document.getElementById("one-timestamp-" + docId).remove();
      document.getElementById("one-email-" + docId).remove();
      document.getElementById("one-content-" + docId).remove();
      Util.enableButton(button, label);
      Util.info("Delete Success!", "Thread Deleted Successfully");
    } catch (e) {
      if (Constant.DEV) console.log(e);
    }
  });
}

import * as Element from "./element.js";
import * as Route from "../controller/route.js";
import * as Auth from "../controller/auth.js";
import { Thread } from "../model/thread.js";
import * as Constant from "../model/constant.js";
import * as FirebaseController from "../controller/firebase_controller.js";
import * as Util from "./util.js";

export function addEventListeners() {
  Element.menuHome.addEventListener("click", () => {
    history.pushState(null, null, Route.routePath.HOME);
    home_page();
  });

  Element.formCreateThread.addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = e.target.title.value;
    const content = e.target.content.value;
    const keywords = e.target.keywords.value;
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

    try {
      const docId = await FirebaseController.addThread(thread);
      thread.docId = docId;
      home_page(); // we will improve this later, this is a hotfix. Adds the new thread when you create one on the page.

      Util.info(
        "Success",
        "A new thread has been added",
        Element.modalCreateThread
      );
    } catch (e) {
      if (Constant.DEV) console.log(e);
      Util.info("Failed to add", JSON.stringify(e), Element.modalCreateThread);
    }
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

  // ` ` : string template. Allows for line breaks.
  //   Element.root.innerHTML = `
  //         <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modal-create-thread"
  //             >+ New Thread</button>
  //   `;
}

function buildHomeScreen(threadList) {
  let html = "";
  html += `
    <button class="btn btn-outline-danger" data-bs-toggle="modal" data-bs-target="#modal-create-thread"
    >+ New Thread</button>
  `;

  if (threadList.length == 0) {
    html += "<h4>No Threads Found</h4>";
    Element.root.innerHTML = html;
    return;
  }

  html += `
    <table class="table table-striped">
    <thead>
        <tr>
        <th scope="col">Action</th>
        <th scope="col">Title</th>
        <th scope="col">Keywords</th>
        <th scope="col">Posted By</th>
        <th scope="col">Content</th>
        <th scope="col">Posted At</th>
        </tr>
    </thead>
    <tbody>
  `;

  threadList.forEach((thread) => {
    html += `
        <tr>
        ${buildThreadView(thread)}
        </tr>
      `;
  });

  html += "</tbody></table>";
  Element.root.innerHTML = html;
}

function buildThreadView(thread) {
  return `
        <td>   
            view
        </td>
        <td>${thread.title}</td>
        <td>${thread.keywordsArray.join(" ")}</td>
        <td>${thread.email}</td>
        <td>${thread.content}</td>
        <td>${new Date(thread.timestamp).toString()}</td>

    `;
}

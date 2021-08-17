import * as Element from "./element.js";
import * as Util from "./util.js";
import * as Auth from "../controller/auth.js";
import * as FirebaseController from "../controller/firebase_controller.js";
import * as Constant from "../model/constant.js";
import * as Home from "./home_page.js";
import * as Route from "../controller/route.js";

export function addEventListeners() {
  Element.formSearch.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchKeys = e.target.searchKeys.value.trim();
    if (searchKeys.length == 0) {
      Util.info("Error", "No search keys");
      return;
    }

    const button = Element.formSearch.getElementsByTagName("button")[0];
    const label = Util.disableButton(button);
    // await Util.sleep(1000);
    const searchKeysInArray = searchKeys.toLowerCase().match(/\S+/g);
    const joinedSearchKeys = searchKeysInArray.join("+");
    history.pushState(
      null,
      null,
      Route.routePath.SEARCH + "#" + joinedSearchKeys
    );
    await search_page(joinedSearchKeys);
    Util.enableButton(button, label);
  });
}

export async function search_page(joinedSearchKeys) {
  if (!joinedSearchKeys) {
    Util.info("Error", "No search keys");
    return;
  }

  const searchKeysInArray = joinedSearchKeys.split("+");
  if (searchKeysInArray.length == 0) {
    Util.info("Error", "No search keys");
    return;
  }

  if (!Auth.currentUser) {
    Element.root.innerHTML = "<h1>Protected Page</h1>";
  }

  let threadList;
  try {
    threadList = await FirebaseController.searchThreads(searchKeysInArray);
  } catch (e) {
    if (Constant.DEV) console.log(e);
    Util.info("Search Error", JSON.stringify(e));
    return;
  }

  Home.buildHomeScreen(threadList);

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
      let docId = e.target.docId.value;
      try {
        await FirebaseController.deleteThread(docId);
        const deleteReply = table.getElementsByClassName(
          "table-row-" + docId
        )[0];
        deleteReply.remove();
        Util.info("Delete Success!", "Thread Deleted Successfully");
      } catch (e) {
        if (Constant.DEV) console.log(e);
      }
    });
  }
}

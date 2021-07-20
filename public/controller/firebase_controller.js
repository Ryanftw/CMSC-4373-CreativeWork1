import * as Constant from "../model/constant.js";
import { Thread } from "../model/thread.js";

export async function signIn(email, password) {
  await firebase.auth().signInWithEmailAndPassword(email, password);
}

export async function signOut() {
  await firebase.auth().signOut();
}

export async function addThread(thread) {
  const ref = await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .add(thread.serialize());
  return ref.id; // SQL => primary key basically.
}

export async function getThreadList() {
  let threadList = [];
  const snapShot = await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .orderBy("timestamp", "desc")
    .get();

  snapShot.forEach((doc) => {
    const t = new Thread(doc.data());
    t.docId = doc.id;
    threadList.push(t);
  });

  return threadList;
}

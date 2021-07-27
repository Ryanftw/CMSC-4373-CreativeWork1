import * as Constant from "../model/constant.js";
import { Reply } from "../model/reply.js";
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

export async function getOneThread(threadId) {
  const ref = await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .doc(threadId)
    .get();
  if (!ref.exists) return null;
  const t = new Thread(ref.data());
  t.docId = threadId;
  return t;
}

export async function addReply(reply) {
  const ref = await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .add(reply.serialize());
  return ref.id;
}

export async function getReplyList(threadId) {
  const snapShot = await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .where("threadId", "==", threadId)
    .orderBy("timestamp")
    .get();
  const replies = [];
  snapShot.forEach((doc) => {
    const r = new Reply(doc.data());
    r.docId = doc.id;
    replies.push(r);
  });
  return replies;
}

export async function searchThreads(keywordsArray) {
  const threadList = [];
  const snapShot = await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .where("keywordsArray", "array-contains-any", keywordsArray)
    .orderBy("timestamp", "desc")
    .get();
  snapShot.forEach((doc) => {
    const t = new Thread(doc.data());
    t.docId = doc.id;
    threadList.push(t);
  });
  return threadList;
}

export async function createAccount(email, password) {
  await firebase.auth().createUserWithEmailAndPassword(email, password);
}

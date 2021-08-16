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

export async function getReplyById(docId) {
  const ref = await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .doc(docId)
    .get();
  if (!ref.exists) return null;
  const r = new Reply(ref.data());
  r.docId = docId;
  return r;
}

export async function updateReply(reply) {
  await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .doc(reply.docId)
    .update({ content: reply.content });
}

export async function deleteReply(docId) {
  await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .doc(docId)
    .delete();
}

export async function updateThread(thread) {
  await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .doc(thread.docId)
    .update({
      content: thread.content,
      title: thread.title,
      keywordsArray: thread.keywordsArray,
    });
}

export async function deleteThread(threadId) {
  const snapShot = await firebase
    .firestore()
    .collection(Constant.collectionNames.REPLIES)
    .where("threadId", "==", threadId)
    .orderBy("timestamp")
    .get();
  snapShot.forEach(async (doc) => {
    await deleteReply(doc.id);
  });
  await firebase
    .firestore()
    .collection(Constant.collectionNames.THREADS)
    .doc(threadId)
    .delete();
}

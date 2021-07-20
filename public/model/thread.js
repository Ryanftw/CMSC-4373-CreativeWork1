export class Thread {
  constructor(data) {
    this.uid = data.uid;
    this.email = data.email;
    this.title = data.title;
    this.timestamp = data.timestamp;
    this.content = data.content;
    this.keywordsArray = data.keywordsArray;
  }

  // to store in Firestore
  serialize() {
    return {
      uid: this.uid,
      email: this.email,
      title: this.title,
      timestamp: this.timestamp,
      content: this.content,
      keywordsArray: this.keywordsArray,
    };
  }
}

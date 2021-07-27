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

  validate_title() {
    if (this.title && this.title.length > 2) return null;
    return "invalid: min length of 3";
  }

  validate_content() {
    if (this.content && this.content.length > 4) return null;
    return "invalid: min length of 5";
  }

  validate_keywords() {
    if (this.keywordsArray && this.keywordsArray.length > 0) return null;
    return "invalid: at least one keyword";
  }
}

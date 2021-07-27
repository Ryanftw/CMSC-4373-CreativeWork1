export class Reply {
  constructor(data) {
    this.threadId = data.threadId;
    this.uid = data.uid;
    this.email = data.email;
    this.timestamp = data.timestamp;
    this.content = data.content;
  }

  serialize() {
    return {
      threadId: this.threadId,
      uid: this.uid,
      email: this.email,
      timestamp: this.timestamp,
      content: this.content,
    };
  }
}

export class Media {

  constructor({ description = "", type = "photo", imageUrl = "", srcUrl = "", base64Data = null, mimeType = null, width = -1, height = -1, duration = -1, memento = '' } = {}) {
    this.base64Data = base64Data;
    this.description = description;
    this.duration = duration;
    this.height = height;
    this.imageUrl = imageUrl;
    this.memento = memento;
    this.mimeType = mimeType;
    this.srcUrl = srcUrl;
    this.type = type;
    this.width = width;
  }
}
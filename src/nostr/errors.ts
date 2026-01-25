// Nostr specific error types
export class NotFoundError extends Error {
  constructor() {
    super("Paste not found");
    this.name = "NotFoundError";
  }
}

export class InvalidEventError extends Error {
  constructor() {
    super("Invalid event format");
    this.name = "InvalidEventError";
  }
}

#!/usr/bin/env npx ts-node

import { Nostr, decodeNoteId } from "snstr";

// Default noslock relays
const RELAYS = [
  "wss://relay.primal.net",
  "wss://nos.lol",
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
];

async function queryNote(noteId: string) {
  // Convert note1... bech32 to hex if needed
  let hexId = noteId;
  if (noteId.startsWith("note1")) {
    try {
      hexId = decodeNoteId(noteId as `${string}1${string}`);
    } catch (e) {
      console.error("Invalid note ID format:", e);
      process.exit(1);
    }
  }

  console.log(`Querying for note: ${hexId}\n`);

  const client = new Nostr(RELAYS);

  try {
    await client.connectToRelays();
    console.log("Connected to relays\n");

    const event = await client.fetchOne(
      [{ ids: [hexId] }],
      { maxWait: 10000 }
    );

    if (event) {
      console.log("=== NOTE FOUND ===\n");
      console.log(JSON.stringify(event, null, 2));
    } else {
      console.log("Note not found on any relay");
    }
  } catch (error) {
    console.error("Error querying note:", error);
  } finally {
    client.disconnectFromRelays();
  }
}

// Get note ID from command line
const noteId = process.argv[2];

if (!noteId) {
  console.log("Usage: npx ts-node query-note.ts <note-id>");
  console.log("  note-id can be hex or bech32 (note1...) format");
  process.exit(1);
}

queryNote(noteId);

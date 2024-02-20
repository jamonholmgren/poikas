// Import types from ../types.d.ts using JSDoc

/**
 * @type {import('../types').PoikasData} PoikasData
 * @type {import('../types').League} League
 * @type {import('../types').Player} Player
 * @type {import('../types').Game} Game
 **/

export function onRequest(context) {
  // current file is ./functions/players/[name].js
  // grab the name from the context

  const name = context.params.name;

  // turn jamon-holmgren into Jamon Holmgren in one line of code
  const fullName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return new Response("Hello " + fullName);
}

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

  return new Response("Hello" + name);
}

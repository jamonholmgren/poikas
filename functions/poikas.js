// Import types from ../types.d.ts using JSDoc

/**
 * @type {import('../types').PoikasData} PoikasData
 * @type {import('../types').League} League
 * @type {import('../types').Player} Player
 * @type {import('../types').Game} Game
 **/

export function onRequest(context) {
  return new Response("Hello, world!");
}

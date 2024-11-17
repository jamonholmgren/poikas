export function routePage(contents: string) {
  return new Response(contents, { headers: { "content-type": "text/html" } })
}

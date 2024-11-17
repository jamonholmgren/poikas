let imageHost = "/images"
export function setImageHost(host: string) {
  imageHost = host
}

export function img(path: string) {
  return `${imageHost}/${path}`
}

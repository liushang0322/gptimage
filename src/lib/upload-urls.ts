export function normalizeStoredUploadPath(input: string): string {
  return input.replace(/^\/+/, "").replace(/^uploads\/+/, "")
}

export function buildUploadProxyUrl(input: string): string {
  const relativePath = normalizeStoredUploadPath(input)
  return `/api/uploads?path=${encodeURIComponent(relativePath)}`
}


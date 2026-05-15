/**
 * Triggers a file download through the server-side proxy.
 * Opens in a new tab so the download happens in the background
 * while the user stays on the current page.
 */
export function downloadFile(
  fileUrl: string,
  fileName: string,
  onProgress?: (percent: number) => void
) {
  const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}`

  const a = document.createElement('a')
  a.href = proxyUrl
  a.download = fileName
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  a.style.display = 'none'

  document.body.appendChild(a)
  a.click()

  setTimeout(() => {
    document.body.removeChild(a)
  }, 1000)
}

/**
 * Enhanced download with progress tracking
 * Shows: total size, downloaded amount, remaining data, speed, ETA
 */

export interface DownloadProgress {
  totalSize: number
  downloadedSize: number
  percentComplete: number
  remainingSize: number
  speed: number // bytes per second
  estimatedTimeRemaining: number // seconds
  startTime: number
}

export function downloadFile(
  fileUrl: string,
  fileName: string,
  onProgress?: (progress: DownloadProgress) => void
) {
  const proxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fileName)}`
  downloadWithProgress(proxyUrl, fileName, onProgress)
}

export async function downloadWithProgress(
  url: string,
  fileName: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`)
    }

    // Get total file size from Content-Length header
    const contentLength = response.headers.get('content-length')
    const totalSize = contentLength ? parseInt(contentLength, 10) : 0

    if (!response.body) {
      throw new Error('Response body is empty')
    }

    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let downloadedSize = 0
    const startTime = Date.now()

    // Read stream with progress tracking
    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      chunks.push(value)
      downloadedSize += value.length

      // Calculate progress metrics
      if (onProgress && totalSize > 0) {
        const elapsedSeconds = (Date.now() - startTime) / 1000
        const speed = downloadedSize / elapsedSeconds // bytes/sec
        const remainingSize = totalSize - downloadedSize
        const estimatedTimeRemaining = speed > 0 ? remainingSize / speed : 0

        onProgress({
          totalSize,
          downloadedSize,
          percentComplete: (downloadedSize / totalSize) * 100,
          remainingSize,
          speed,
          estimatedTimeRemaining,
          startTime,
        })
      }
    }

    // Convert chunks to blob and trigger download
    const blob = new Blob(chunks, { type: 'application/octet-stream' })
    const blobUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    a.style.display = 'none'

    document.body.appendChild(a)
    a.click()

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    }, 100)
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

/**
 * Helper to format bytes to human-readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Helper to format time in seconds to readable format
 */
export function formatTime(seconds: number): string {
  if (seconds < 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

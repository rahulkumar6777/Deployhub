export const progressLogger = (label) => {
  let lastPercent = -1
  return (progress) => {
    if (progress.percent === lastPercent) return
    lastPercent = progress.percent
    console.log(`${label}: ${progress.percent}% (${progress.uploadedBytes}/${progress.totalBytes} bytes)`)
  }
}
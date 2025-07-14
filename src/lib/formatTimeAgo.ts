export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  let interval = seconds / 31536000
  if (interval > 1) {
    return Math.floor(interval) + " year" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  }
  interval = seconds / 2592000
  if (interval > 1) {
    return Math.floor(interval) + " month" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  }
  interval = seconds / 86400
  if (interval > 1) {
    return Math.floor(interval) + " day" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  }
  interval = seconds / 3600
  if (interval > 1) {
    return Math.floor(interval) + " hour" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  }
  interval = seconds / 60
  if (interval > 1) {
    return Math.floor(interval) + " minute" + (Math.floor(interval) === 1 ? "" : "s") + " ago"
  }
  return Math.floor(seconds) + " second" + (Math.floor(seconds) === 1 ? "" : "s") + " ago"
}

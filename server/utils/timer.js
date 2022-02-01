exports.createTimer = () => {
  let currentTime = new Date().getTime()
  return {
    times: {},
    step (step) {
      const newTime = new Date().getTime()
      this.times[step] = (this.times[step] || 0) + (newTime - currentTime)
      currentTime = newTime
    },
  }
}

exports.generateMessage = (text) => {
  return {
    text: text,
    createAt: new Date().getTime()
  }
}

exports.generateMessage = (text, username = null) => {
  return {
    username,
    text: text,
    createAt: new Date().getTime()
  }
}

const chalk = require('chalk')

const color = (text, colorName) => {
return !colorName ? chalk.green(text) : chalk.keyword(colorName)(text)
}

module.exports = { color }

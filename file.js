const fs = require('fs');

const readFile = (FILE_NAME) =>{
    if(!fs.existsSync(FILE_NAME)){
        fs.writeFileSync(FILE_NAME,JSON.stringify([]))
    }
    return JSON.parse(fs.readFileSync(FILE_NAME,'utf-8'))
}

const writeFile = (FILE_NAME,DATA) => {
    fs.writeFileSync(FILE_NAME,JSON.stringify(DATA,null,2))
}

module.exports = {readFile,writeFile}
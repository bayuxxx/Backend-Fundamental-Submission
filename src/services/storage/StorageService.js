const fs = require("fs");
const path = require("path");

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    return new Promise((resolve, reject) => {
      const filename = `${+new Date()}-${meta.filename}`;
      const filePath = path.resolve(this._folder, filename);
      const fileStream = fs.createWriteStream(filePath);

      fileStream.on("error", (error) => reject(error));
      file.pipe(fileStream);
      file.on("end", () => resolve(filename));
    });
  }
}

module.exports = StorageService;

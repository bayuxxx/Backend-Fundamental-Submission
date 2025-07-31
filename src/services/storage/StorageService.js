// src/services/storage/StorageService.js
const fs = require('fs');
const { nanoid } = require('nanoid');

class StorageService {
  constructor(folder) {
    this._folder = folder;

    // Membuat folder jika belum ada
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  writeFile(file, meta) {
    // Membuat nama file yang unik untuk menghindari duplikasi
    const filename = `${nanoid(16)}_${meta.filename}`;
    const path = `${this._folder}/${filename}`;

    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('finish', () => resolve(filename));
    });
  }
}

module.exports = StorageService;
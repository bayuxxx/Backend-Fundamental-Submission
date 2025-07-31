const { Pool } = require("pg");
const { nanoid } = require("nanoid");
const InvariantError = require("../../exceptions/InvariantError");
const NotFoundError = require("../../exceptions/NotFoundError");

class AlbumsService {
  // --- [MODIFIED] ---
  constructor(cacheService = null) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  // ... (addAlbum, getAllAlbums, etc. tidak berubah)
  async addAlbum({ name, year }) {
    const id = `album-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO albums (id, name, year) VALUES ($1, $2, $3) RETURNING id",
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError("Album gagal ditambahkan");
    }

    return result.rows[0].id;
  }

  async getAllAlbums() {
    const result = await this._pool.query("SELECT id, name FROM albums");
    return result.rows;
  }

  async getAlbumById(id) {
    const queryAlbum = {
      text: 'SELECT id, name, year, "coverUrl" FROM albums WHERE id = $1',
      values: [id],
    };
    const resultAlbum = await this._pool.query(queryAlbum);

    if (!resultAlbum.rowCount) {
      throw new NotFoundError("Album tidak ditemukan");
    }

    const querySongs = {
      text: 'SELECT id, title, performer FROM songs WHERE "album_id" = $1',
      values: [id],
    };
    const resultSongs = await this._pool.query(querySongs);

    const albumData = resultAlbum.rows[0];
    albumData.songs = resultSongs.rows;

    return albumData;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: "UPDATE albums SET name = $1, year = $2 WHERE id = $3 RETURNING id",
      values: [name, year, id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Gagal memperbarui album. Id tidak ditemukan");
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: "DELETE FROM albums WHERE id = $1 RETURNING id",
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("Album gagal dihapus. Id tidak ditemukan");
    }
  }

  async addAlbumCover(albumId, coverUrl) {
    const query = {
      text: 'UPDATE albums SET "coverUrl" = $1 WHERE id = $2 RETURNING id',
      values: [coverUrl, albumId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError(
        "Gagal memperbarui sampul. Id album tidak ditemukan",
      );
    }
  }

  // --- [NEW METHOD] ---
  async addAlbumLike(albumId, userId) {
    await this.getAlbumById(albumId);

    const checkQuery = {
      text: "SELECT id FROM user_album_likes WHERE user_id = $1 AND album_id = $2",
      values: [userId, albumId],
    };
    const checkResult = await this._pool.query(checkQuery);

    if (checkResult.rowCount > 0) {
      throw new InvariantError("Album sudah Anda sukai");
    }

    const id = `like-${nanoid(16)}`;
    const query = {
      text: "INSERT INTO user_album_likes (id, user_id, album_id) VALUES($1, $2, $3) RETURNING id",
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new InvariantError("Gagal menyukai album");
    }

    if (this._cacheService) {
      await this._cacheService.delete(`likes:${albumId}`);
    }
  }

  // --- [NEW METHOD] ---
  async deleteAlbumLike(albumId, userId) {
    const query = {
      text: "DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id",
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rowCount) {
      throw new NotFoundError("Gagal batal suka. Like tidak ditemukan");
    }

    if (this._cacheService) {
      await this._cacheService.delete(`likes:${albumId}`);
    }
  }

  // --- [NEW METHOD] ---
  async getAlbumLikes(albumId) {
    try {
      if (this._cacheService) {
        const result = await this._cacheService.get(`likes:${albumId}`);
        return { likes: parseInt(result, 10), source: "cache" };
      }
    } catch (error) {
      // Abaikan error jika cache miss, lanjutkan ke database
    }

    await this.getAlbumById(albumId);
    
    const query = {
      text: "SELECT COUNT(id) FROM user_album_likes WHERE album_id = $1",
      values: [albumId],
    };

    const result = await this._pool.query(query);
    const likes = parseInt(result.rows[0].count, 10);

    if (this._cacheService) {
      await this._cacheService.set(`likes:${albumId}`, likes);
    }

    return { likes, source: "db" };
  }
}

module.exports = AlbumsService;
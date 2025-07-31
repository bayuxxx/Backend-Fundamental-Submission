const { Pool } = require("pg");

class PlaylistsService {
  constructor() {
    this._pool = new Pool();
  }

  async getSongsFromPlaylist(playlistId) {
    const query = {
      text: `SELECT p.id, p.name, u.username,
               COALESCE(
                 (SELECT json_agg(json_build_object('id', s.id, 'title', s.title, 'performer', s.performer))
                  FROM playlist_songs ps
                  JOIN songs s ON s.id = ps.song_id
                  WHERE ps.playlist_id = p.id),
                 '[]'::json
               ) AS songs
             FROM playlists p
             LEFT JOIN users u ON u.id = p.owner
             WHERE p.id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);

    return result.rows[0];
  }
}

module.exports = PlaylistsService;


exports.up = (pgm) => {
    pgm.createTable('albums', {
        id: {
            type: 'varchar(50)',
            primaryKey: true,
        },
        name: {
            type: 'varchar(255)',
            notNull: true,
        },
        year: {
            type: 'integer',
            notNull: true,
        },
        created_at: {
            type: 'timestamp',
            default: pgm.func('CURRENT_TIMESTAMP'),
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable('albums');
};

exports.up = (pgm) => {
  pgm.dropColumn("albums", "created_at");
};

exports.down = (pgm) => {
  pgm.addColumn("albums", {
    created_at: {
      type: "timestamp",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
};

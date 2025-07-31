require("dotenv").config({ path: "../.env" });
const amqplib = require("amqplib");
const PlaylistsService = require("./PlaylistsService");
const MailSender = require("./MailSender");

const listen = async () => {
  const playlistsService = new PlaylistsService();
  const mailSender = new MailSender();

  const connection = await amqplib.connect(process.env.RABBITMQ_SERVER);
  const channel = await connection.createChannel();

  const queue = "export:playlists";
  await channel.assertQueue(queue, {
    durable: true,
  });

  console.log(`[.] Menunggu pesan di queue: ${queue}`);

  channel.consume(
    queue,
    async (message) => {
      try {
        const { playlistId, targetEmail } = JSON.parse(
          message.content.toString(),
        );
        console.log(
          `[x] Menerima permintaan ekspor untuk playlist ${playlistId} ke ${targetEmail}`,
        );

        const playlistData =
          await playlistsService.getSongsFromPlaylist(playlistId);
        const content = JSON.stringify({ playlist: playlistData }, null, 2);

        await mailSender.sendEmail(targetEmail, content);
        console.log(`[v] Email berhasil dikirim ke ${targetEmail}`);
      } catch (error) {
        console.error(`[!] Gagal memproses pesan: ${error.message}`);
      } finally {
        channel.ack(message);
      }
    },
    { noAck: false },
  );
};

listen();

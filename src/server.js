import { createServer } from "node:http";
import { Server } from "socket.io";
import env from "./config/env.js";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { ensureBucketExists } from "./config/minio.js";
import { setSocketServer } from "./utils/socket.js";

try {
    await connectDB();
    await ensureBucketExists();

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
        cors: { origin: env.CLIENT_URL, credentials: true },
    });

    io.on("connection", (socket) => {
        socket.on("join", ({ userId }) => {
            if (!userId) {
                return;
            }

            socket.join(`user:${userId}`);
        });
    });

    setSocketServer(io);

    httpServer.listen(env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`Server is running on http://localhost:${env.PORT}`);
    });
} catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to bootstrap server", error);
    process.exit(1);
}

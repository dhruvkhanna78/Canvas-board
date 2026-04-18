const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const PORT = process.env.PORT || 8000;
const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
});

app.get("/", (req, res) => {
    res.send("Canvas Board Server is running");
});

// Room structure memory mein store karne ke liye
const rooms = {};

io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    // JOIN ROOM
    socket.on("join-room", (roomId) => {
        const rId = String(roomId);
        socket.join(rId);
        if (!rooms[rId]) rooms[rId] = [];
        socket.emit("load-canvas", rooms[rId]);
    });

    // PEN / ERASER START
    socket.on("start-draw", (data) => {
        const { roomId, x, y, color, isEraser } = data;
        if (!rooms[roomId]) return;

        const stroke = {
            type: "stroke",
            points: [{ x, y }],
            color: color,
            userId: socket.id,
            isEraser: !!isEraser, // Strict boolean check
        };

        rooms[roomId].push(stroke);
        // Dusre users ko bhej rahe hain saara data including isEraser
        socket.to(roomId).emit("start-draw", { 
            x, y, color, roomId, 
            userId: socket.id, 
            isEraser: !!isEraser 
        });
    });

    // PEN / ERASER MOVE
    socket.on("draw", (data) => {
        const { roomId, x, y } = data;
        if (!rooms[roomId]) return;

        const userStroke = rooms[roomId]
            .slice()
            .reverse()
            .find((s) => s.type === "stroke" && s.userId === socket.id);

        if (userStroke) {
            userStroke.points.push({ x, y });
            // Broadcast mein point ke saath isEraser flag bhi bhej rahe hain backup ke liye
            socket.to(roomId).emit("draw", { 
                x, y, roomId, 
                isEraser: userStroke.isEraser 
            });
        }
    });

    // SHAPES (Rect, Ellipse, Line, Arrow)
    socket.on("draw-rect", (data) => {
        if (!rooms[data.roomId]) return;
        rooms[data.roomId].push({ ...data, userId: socket.id });
        socket.to(data.roomId).emit("draw-rect", data);
    });

    socket.on("draw-ellipse", (data) => {
        if (!rooms[data.roomId]) return;
        rooms[data.roomId].push({ ...data, userId: socket.id });
        socket.to(data.roomId).emit("draw-ellipse", data);
    });

    socket.on("draw-line", (data) => {
        if (!rooms[data.roomId]) return;
        rooms[data.roomId].push({ ...data, userId: socket.id });
        socket.to(data.roomId).emit("draw-line", data);
    });

    socket.on("draw-arrow", (data) => {
        if (!rooms[data.roomId]) return;
        rooms[data.roomId].push({ ...data, userId: socket.id });
        socket.to(data.roomId).emit("draw-arrow", data);
    });

    // IMAGE SYNC
    socket.on("draw-image", (data) => {
        if (!rooms[data.roomId]) return;
        rooms[data.roomId].push({ ...data, userId: socket.id });
        socket.to(data.roomId).emit("draw-image", data);
    });

    // FULL CANVAS SYNC (Used for Undo/Redo/Background Change)
    socket.on("sync-canvas", (fullShapes, roomId) => {
        if (rooms[roomId]) {
            rooms[roomId] = fullShapes;
            io.to(roomId).emit("update-full-canvas", fullShapes);
        }
    });

    socket.on("end-draw", (data) => {
        socket.to(data.roomId).emit("end-draw", data);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected:", socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
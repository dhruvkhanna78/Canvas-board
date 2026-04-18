import { io } from "socket.io-client";

const BACKEND_URL = "https://canvas-board-il4x.onrender.com/"

export const socket = io(BACKEND_URL, {
    transports: ["websocket"],
});
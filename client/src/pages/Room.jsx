import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import Toolbar from "../components/Toolbar";

export default function Room() {
    const { roomId } = useParams();
    const canvasRef = useRef(null);
    const shapesRef = useRef([]);
    const redoStackRef = useRef([]);
    const cameraRef = useRef({ x: 0, y: 0, scale: 1 });
    const isPanningRef = useRef(false);
    const drawingRef = useRef(false);
    const currentStrokeRef = useRef(null);
    const imageCache = useRef({});

    const [tool, setToolState] = useState("pen");
    const toolRef = useRef("pen");
    const [color, setColorState] = useState("#ffffff");
    const colorRef = useRef("#ffffff");
    const [bgColor, setBgColor] = useState("#0f172a");
    const [previewShape, setPreviewShape] = useState(null);

    const toWorld = (x, y) => ({
        x: (x - cameraRef.current.x) / cameraRef.current.scale,
        y: (y - cameraRef.current.y) / cameraRef.current.scale,
    });

    const setTool = (val) => { toolRef.current = val; setToolState(val); };
    const changeColor = (e) => { colorRef.current = e.target.value; setColorState(e.target.value); };
    const toggleBg = () => setBgColor(prev => prev === "#0f172a" ? "#ffffff" : "#0f172a");

    const drawArrowHead = (ctx, x, y, angle) => {
        const headLen = 15 / cameraRef.current.scale;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLen * Math.cos(angle - Math.PI / 6), y - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - headLen * Math.cos(angle + Math.PI / 6), y - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
    };

    const renderShape = (ctx, shape) => {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (shape.isEraser) {
            // Eraser logic
            ctx.save();
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = 20 / cameraRef.current.scale;
            ctx.beginPath();
            shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
            ctx.stroke();
            ctx.restore();
        } else {
            // Normal Drawing logic
            ctx.strokeStyle = shape.color || "#ffffff";
            ctx.lineWidth = 2 / cameraRef.current.scale;

            if (shape.type === "stroke") {
                ctx.beginPath();
                shape.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (shape.type === "rect") {
                ctx.strokeRect(shape.startX, shape.startY, shape.width, shape.height);
            } else if (shape.type === "ellipse") {
                ctx.beginPath();
                ctx.ellipse(shape.centerX, shape.centerY, Math.abs(shape.rx), Math.abs(shape.ry), 0, 0, Math.PI * 2);
                ctx.stroke();
            } else if (shape.type === "line" || shape.type === "arrow") {
                ctx.beginPath();
                ctx.moveTo(shape.startX, shape.startY);
                ctx.lineTo(shape.endX, shape.endY);
                ctx.stroke();
                if (shape.type === "arrow") {
                    const angle = Math.atan2(shape.endY - shape.startY, shape.endX - shape.startX);
                    drawArrowHead(ctx, shape.endX, shape.endY, angle);
                }
            } else if (shape.type === "image") {
                if (imageCache.current[shape.src]) {
                    ctx.drawImage(imageCache.current[shape.src], shape.x, shape.y, 200, 200);
                } else {
                    const img = new Image();
                    img.src = shape.src;
                    img.onload = () => { imageCache.current[shape.src] = img; };
                }
            }
        }
    };

    const undo = () => {
        const myLastIdx = [...shapesRef.current].reverse().findIndex(s => s.userId === socket.id);
        if (myLastIdx === -1) return;
        const actualIdx = shapesRef.current.length - 1 - myLastIdx;
        const [removed] = shapesRef.current.splice(actualIdx, 1);
        redoStackRef.current.push(removed);
        socket.emit("sync-canvas", shapesRef.current, roomId);
    };

    const redo = () => {
        if (redoStackRef.current.length === 0) return;
        shapesRef.current.push(redoStackRef.current.pop());
        socket.emit("sync-canvas", shapesRef.current, roomId);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (f) => {
            const worldPos = toWorld(window.innerWidth / 2, window.innerHeight / 2);
            const newImg = { type: "image", src: f.target.result, x: worldPos.x, y: worldPos.y, userId: socket.id };
            shapesRef.current.push(newImg);
            socket.emit("draw-image", { ...newImg, roomId });
        };
        reader.readAsDataURL(file);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        let animationFrame;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", resize);
        resize();

        const render = () => {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.translate(cameraRef.current.x, cameraRef.current.y);
            ctx.scale(cameraRef.current.scale, cameraRef.current.scale);

            shapesRef.current.forEach(shape => renderShape(ctx, shape));

            if (previewShape) {
                ctx.save();
                ctx.setLineDash([5, 5]);
                renderShape(ctx, previewShape);
                ctx.restore();
            }

            animationFrame = requestAnimationFrame(render);
        };

        const handleMouseDown = (e) => {
            if (isPanningRef.current || e.button !== 0) return;
            const worldPos = toWorld(e.clientX, e.clientY);
            drawingRef.current = true;
            canvas.dataset.startX = worldPos.x;
            canvas.dataset.startY = worldPos.y;

            if (toolRef.current === "pen" || toolRef.current === "eraser") {
                const isEraser = toolRef.current === "eraser";
                currentStrokeRef.current = {
                    type: "stroke",
                    points: [worldPos],
                    color: colorRef.current,
                    userId: socket.id,
                    isEraser: isEraser
                };
                shapesRef.current.push(currentStrokeRef.current);
                socket.emit("start-draw", { ...worldPos, color: colorRef.current, roomId, isEraser });
            }
        };

        const handleMouseMove = (e) => {
            const worldPos = toWorld(e.clientX, e.clientY);
            if (isPanningRef.current) {
                cameraRef.current.x += e.movementX;
                cameraRef.current.y += e.movementY;
                return;
            }
            if (!drawingRef.current) return;

            const startX = parseFloat(canvas.dataset.startX);
            const startY = parseFloat(canvas.dataset.startY);

            if (toolRef.current === "pen" || toolRef.current === "eraser") {
                currentStrokeRef.current.points.push(worldPos);
                socket.emit("draw", { ...worldPos, roomId });
            } else if (toolRef.current === "rect") {
                setPreviewShape({ type: "rect", startX, startY, width: worldPos.x - startX, height: worldPos.y - startY, color: colorRef.current });
            } else if (toolRef.current === "ellipse") {
                const rx = (worldPos.x - startX) / 2;
                const ry = (worldPos.y - startY) / 2;
                setPreviewShape({ type: "ellipse", centerX: startX + rx, centerY: startY + ry, rx, ry, color: colorRef.current });
            } else if (toolRef.current === "line" || toolRef.current === "arrow") {
                setPreviewShape({ type: toolRef.current, startX, startY, endX: worldPos.x, endY: worldPos.y, color: colorRef.current });
            }
        };

        const handleMouseUp = () => {
            if (!drawingRef.current) return;
            drawingRef.current = false;

            if (previewShape) {
                const finalShape = { ...previewShape, userId: socket.id };
                shapesRef.current.push(finalShape);
                socket.emit(`draw-${finalShape.type}`, { ...finalShape, roomId });
                setPreviewShape(null);
            }
            socket.emit("end-draw", { roomId });
        };

        const handleWheel = (e) => {
            e.preventDefault();
            if (e.ctrlKey) {
                const zoom = Math.exp(-e.deltaY * 0.005);
                const newScale = cameraRef.current.scale * zoom;
                if (newScale > 0.05 && newScale < 15) {
                    cameraRef.current.x = e.clientX - (e.clientX - cameraRef.current.x) * zoom;
                    cameraRef.current.y = e.clientY - (e.clientY - cameraRef.current.y) * zoom;
                    cameraRef.current.scale = newScale;
                }
            } else {
                cameraRef.current.x -= e.deltaX;
                cameraRef.current.y -= e.deltaY;
            }
        };

        socket.emit("join-room", roomId);
        socket.on("load-canvas", (data) => shapesRef.current = data);
        socket.on("update-full-canvas", (data) => shapesRef.current = data);
        
        // FIX: start-draw mein data.isEraser flag ko handle kar rahe hain
        socket.on("start-draw", (data) => {
            shapesRef.current.push({ 
                type: "stroke", 
                points: [{ x: data.x, y: data.y }], 
                color: data.color, 
                userId: data.userId, 
                isEraser: data.isEraser 
            });
        });

        socket.on("draw", (data) => {
            const last = shapesRef.current[shapesRef.current.length - 1];
            if (last?.type === "stroke") last.points.push({ x: data.x, y: data.y });
        });

        const genericDraw = (data) => shapesRef.current.push(data);
        socket.on("draw-rect", genericDraw);
        socket.on("draw-ellipse", genericDraw);
        socket.on("draw-line", genericDraw);
        socket.on("draw-arrow", genericDraw);
        socket.on("draw-image", genericDraw);

        canvas.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        canvas.addEventListener("wheel", handleWheel, { passive: false });

        const keyD = (e) => { if (e.code === "Space") isPanningRef.current = true; };
        const keyU = (e) => { if (e.code === "Space") isPanningRef.current = false; };
        window.addEventListener("keydown", keyD);
        window.addEventListener("keyup", keyU);

        render();
        return () => {
            cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", resize);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("keydown", keyD);
            window.removeEventListener("keyup", keyU);
            socket.off();
        };
    }, [roomId, bgColor, previewShape]);

    return (
        <div className="w-screen h-screen relative overflow-hidden" style={{ backgroundColor: bgColor }}>
            <Toolbar
                tool={tool} setTool={setTool}
                undo={undo} redo={redo}
                handleImageUpload={handleImageUpload}
                color={color} changeColor={changeColor}
                toggleBg={toggleBg} bgColor={bgColor}
            />
            <canvas ref={canvasRef} className="block w-full h-full touch-none cursor-crosshair" />
        </div>
    );
}
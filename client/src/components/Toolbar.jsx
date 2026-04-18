import React from 'react';
import { 
    Pencil, 
    Square, 
    Circle, 
    Image as ImageIcon, 
    Undo2, 
    Redo2, 
    Share2, 
    Sun, 
    Moon,
    Minus,      // Line ke liye
    ArrowRight,  // Arrow ke liye
    Eraser
} from 'lucide-react';

const Toolbar = ({ tool, setTool, undo, redo, handleImageUpload, color, changeColor, toggleBg, bgColor }) => {
    
    // Tools array for cleaner mapping
    const mainTools = [
        { id: "pen", icon: Pencil, label: "Pen Tool" },
        { id: "rect", icon: Square, label: "Rectangle Tool" },
        { id: "ellipse", icon: Circle, label: "Ellipse Tool" },
        { id: "line", icon: Minus, label: "Line Tool" },
        { id: "arrow", icon: ArrowRight, label: "Arrow Tool" },
        { id: "eraser", icon: Eraser, label: "Eraser Tool" } // Eraser ke liye bhi Pencil icon use kar rahe hain, bas color white set kar denge
    ];

    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-800/95 p-2 px-4 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md">
            
            {/* Main Drawing Tools */}
            <div className="flex gap-1 border-r border-slate-600 pr-2">
                {mainTools.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTool(t.id)}
                        title={t.label}
                        className={`p-2 rounded-lg transition-all ${
                            tool === t.id 
                            ? "bg-blue-600 text-white shadow-md" 
                            : "text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                        }`}
                    >
                        <t.icon size={20} strokeWidth={2.5} />
                    </button>
                ))}
            </div>

            {/* Color & Image Upload */}
            <div className="flex items-center gap-3 border-r border-slate-600 pr-2">
                <div className="relative flex items-center group">
                    <input 
                        type="color" 
                        value={color} 
                        onChange={changeColor} 
                        className="w-8 h-8 rounded-full cursor-pointer bg-transparent border-2 border-slate-600 overflow-hidden"
                    />
                </div>

                <input type="file" id="img-up" hidden onChange={handleImageUpload} accept="image/*" />
                <label 
                    htmlFor="img-up" 
                    title="Upload Image"
                    className="cursor-pointer p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg transition-colors"
                >
                    <ImageIcon size={20} strokeWidth={2.5} />
                </label>
            </div>

            {/* History Controls (Undo/Redo) */}
            <div className="flex gap-1 border-r border-slate-600 pr-2">
                <button onClick={undo} title="Undo" className="p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg">
                    <Undo2 size={20} strokeWidth={2.5} />
                </button>
                <button onClick={redo} title="Redo" className="p-2 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded-lg">
                    <Redo2 size={20} strokeWidth={2.5} />
                </button>
            </div>

            {/* Extra Controls (Theme & Share) */}
            <div className="flex items-center gap-2">
                <button 
                    onClick={toggleBg} 
                    title="Toggle Theme"
                    className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                    {bgColor === "#0f172a" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("Room Link Copied!");
                    }} 
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-3 py-1.5 rounded-lg text-white text-sm font-bold transition-all shadow-lg shadow-green-900/20"
                >
                    <Share2 size={16} strokeWidth={2.5} />
                    <span>Share</span>
                </button>
            </div>
        </div>
    );
}

export default Toolbar;
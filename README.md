# Canvas-board

A high-performance, real-time collaborative whiteboard. Features include free-hand drawing, geometric shapes, image uploads, infinite panning/zooming, and instant synchronization across multiple users.

## ✨ Features

- **Real-Time Collaboration**: Instant sync of all drawings and actions using Socket.io.
- **Infinite Canvas**: Support for zooming (Ctrl + Scroll) and panning (Space + Drag) using World-to-Screen coordinate mapping.
- **Multi-Tool Support**: Pen, Eraser, Rectangle, Ellipse, Line, and Arrow tools.
- **Image Integration**: Upload and position images directly onto the canvas.
- **Undo/Redo**: Track history locally to manage your workflow.
- **Cross-Platform**: Fully responsive design with unified support for Mouse and Touch events (Mobile & Tablet).
- **Customizable**: Toggle background themes and change drawing colors on the fly.

## 🛠️ Tech Stack

- **Frontend**: React.js, Tailwind CSS
- **Canvas API**: HTML5 Canvas for high-performance rendering.
- **Backend**: Node.js with Socket.io (Real-time engine).
- **Bundler**: Vite (Fast HMR and builds).

## 🏗️ Architecture Decisions

1. **World Space Coordinate System**: To support zooming and panning, all coordinates are stored in "World Space". They are only converted to "Screen Space" during rendering. This ensures that the drawing remains spatially consistent regardless of the user's zoom level.
2. **Performance Optimization (Refs vs State)**: Used `useRef` for high-frequency updates (mouse/touch coordinates, camera movements, and preview shapes) to bypass React's re-render cycle. This eliminates jitter and ensures 60fps performance.
3. **Optimistic Rendering**: Local actions are rendered immediately, while synchronization happens in the background via Sockets to ensure a lag-free experience.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dhruvkhanna78/Canvas-board
   cd Canvas-board
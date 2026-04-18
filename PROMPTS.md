# AI Usage Documentation

I used AI (Gemini) as a pair-programmer to assist with specific technical roadblocks and to speed up the development process within the 24-hour limit.

## How AI Assisted Me:

- **Mathematical Debugging**: I consulted AI to verify the coordinate transformation math for the `toWorld` function, ensuring that shapes remained locked in place during zooming and panning.
- **Cross-Platform Compatibility**: While I built the core logic for mouse events, I used AI to quickly identify the equivalent `touch` event properties to ensure the board worked seamlessly on mobile browsers.
- **Optimization Strategy**: I brainstormed with AI on how to eliminate canvas flickering. This led me to move the `previewShape` into a `useRef` rather than `useState` to avoid unnecessary React re-renders.
- **Boilerplate & Docs**: AI helped me quickly draft the initial project structure and README documentation, allowing me to focus more on the core Canvas and Socket.io implementation.

## Key Prompts Example:
- "Check this math for mapping screen coordinates to a scaled and translated canvas coordinate system."
- "What is the best way to prevent default touch behavior in mobile Chrome while using a drawing app?"
- "Help me debug a CORS issue between my Vercel frontend and Render backend for Socket.io."

All major architectural decisions, the choice of the MERN stack, and the overall project flow were designed and implemented by me.
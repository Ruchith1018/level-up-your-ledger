import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Remove initial loader after React mounts
const removeLoader = () => {
    const loader = document.getElementById("initial-loader");
    if (loader) {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.3s ease-out";
        setTimeout(() => loader.remove(), 300);
    }
};

createRoot(document.getElementById("root")!).render(<App />);

// Remove loader after a short delay to ensure smooth transition
setTimeout(removeLoader, 100);

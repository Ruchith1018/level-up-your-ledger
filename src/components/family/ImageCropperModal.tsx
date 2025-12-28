import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";

interface ImageCropperModalProps {
    open: boolean;
    onClose: () => void;
    imageSrc: string | null;
    onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropperModal({ open, onClose, imageSrc, onCropComplete }: ImageCropperModalProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<HTMLImageElement | null>(null);

    // Load image when src changes
    useEffect(() => {
        if (!imageSrc) return;
        const img = new Image();
        img.src = imageSrc;
        img.onload = () => {
            setImage(img);
            setZoom(1);
            setOffset({ x: 0, y: 0 });
        };
    }, [imageSrc]);

    // Draw canvas
    useEffect(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Calculate dimensions
        // We want a square crop, so the canvas size is fixed (e.g., 300x300)
        // But we draw the image based on zoom and offset

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        ctx.save();
        ctx.translate(centerX + offset.x, centerY + offset.y);
        ctx.scale(zoom, zoom);

        // Draw image centered
        ctx.drawImage(image, -image.width / 2, -image.height / 2);
        ctx.restore();

        // Optional: Draw overlay mask (circular or square border)
        // For square profile pics, a simple square border is enough visual cue
        // But for family profile which is circular in UI, maybe a circle mask?
        // Let's stick to square output but show a circle guide if possible, or just square for simplicity first.
    }, [image, zoom, offset]);

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleSave = async () => {
        if (!image || !canvasRef.current) return;
        setLoading(true);

        // To get high quality crop, we shouldn't just grab the canvas content directly if the canvas is small (300px).
        // Instead, we should create a new canvas with the desired output size (e.g. 500x500) and draw there using the same parameters.

        const outputSize = 500;
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;
        const ctx = outputCanvas.getContext('2d');

        if (ctx) {
            // Fill white background just in case
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, outputSize, outputSize);

            // Scale parameters: outputCanvas / previewCanvas
            const scaleFactor = outputSize / canvasRef.current.width;

            const centerX = outputSize / 2;
            const centerY = outputSize / 2;

            ctx.translate(centerX + (offset.x * scaleFactor), centerY + (offset.y * scaleFactor));
            ctx.scale(zoom * scaleFactor, zoom * scaleFactor);
            ctx.drawImage(image, -image.width / 2, -image.height / 2);

            outputCanvas.toBlob((blob) => {
                if (blob) {
                    onCropComplete(blob);
                }
                setLoading(false);
                onClose();
            }, 'image/jpeg', 0.9);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && !loading && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    <div
                        className="relative ring-4 ring-primary/20 rounded-full overflow-hidden cursor-move touch-none"
                        style={{ width: 300, height: 300 }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <canvas
                            ref={canvasRef}
                            width={300}
                            height={300}
                            className="bg-muted w-full h-full"
                        />
                        {/* Overlay to hint at circular crop */}
                        <div className="absolute inset-0 border-[50px] border-black/30 rounded-full pointer-events-none transition-colors" />
                    </div>

                    <div className="w-full space-y-4 px-4">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><ZoomOut className="w-3 h-3" /> Zoom Out</span>
                            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Zoom In</span>
                        </div>
                        <Slider
                            value={[zoom]}
                            min={0.5}
                            max={3}
                            step={0.1}
                            onValueChange={(vals) => setZoom(vals[0])}
                        />
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Move className="w-3 h-3" /> Drag image to adjust position
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save & Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

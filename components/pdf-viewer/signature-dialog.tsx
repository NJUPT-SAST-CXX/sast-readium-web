"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pen, Image as ImageIcon, Trash2, Plus, Eraser } from "lucide-react";
import { usePDFStore } from "@/lib/pdf";

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (signature: string) => void;
}

export function SignatureDialog({
  open,
  onOpenChange,
  onSelect,
}: SignatureDialogProps) {
  const { signatures, addSignature, removeSignature } = usePDFStore();
  const [activeTab, setActiveTab] = useState("draw");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Drawing state
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    if (open && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2; // Retina support
      canvas.height = canvas.offsetHeight * 2;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;

      const context = canvas.getContext("2d");
      if (context) {
        context.scale(2, 2);
        context.lineCap = "round";
        context.strokeStyle = "black";
        context.lineWidth = 2;
        contextRef.current = context;
      }
    }
  }, [open, activeTab]);

  const startDrawing = ({
    nativeEvent,
  }: React.MouseEvent | React.TouchEvent) => {
    if (!contextRef.current) return;

    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !contextRef.current) return;

    const { offsetX, offsetY } = getCoordinates(nativeEvent);
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (event: MouseEvent | TouchEvent) => {
    if (!canvasRef.current) return { offsetX: 0, offsetY: 0 };

    if (event instanceof MouseEvent) {
      return { offsetX: event.offsetX, offsetY: event.offsetY };
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      offsetX: touch.clientX - rect.left,
      offsetY: touch.clientY - rect.top,
    };
  };

  const clearCanvas = () => {
    if (canvasRef.current && contextRef.current) {
      contextRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSignature = () => {
    let signatureData = "";

    if (activeTab === "draw" && canvasRef.current) {
      // Trim the canvas (optional optimization, skip for now)
      signatureData = canvasRef.current.toDataURL("image/png");
    } else if (activeTab === "image" && uploadedImage) {
      signatureData = uploadedImage;
    }

    if (signatureData) {
      addSignature(signatureData);
      clearCanvas();
      setUploadedImage(null);
      // Optionally select it immediately?
      // onSelect(signatureData);
      // onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Signatures</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-4 sm:gap-6 h-auto sm:h-[400px]">
          {/* Sidebar - Saved Signatures */}
          <div className="border-b sm:border-b-0 sm:border-r pb-4 sm:pb-0 sm:pr-4 flex flex-col gap-2 overflow-hidden max-h-[150px] sm:max-h-none">
            <Label className="mb-2">Saved Signatures</Label>
            <div className="flex-1 overflow-y-auto space-y-2 flex-row sm:flex-col flex sm:block gap-2">
              {signatures.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No signatures yet
                </div>
              )}
              {signatures.map((sig, index) => (
                <div
                  key={index}
                  className="group relative border rounded-md p-2 hover:bg-accent cursor-pointer"
                  onClick={() => {
                    onSelect(sig);
                    onOpenChange(false);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Dynamic data URL from user-generated signature */}
                  <img
                    src={sig}
                    alt={`Signature ${index + 1}`}
                    className="w-full h-auto max-h-[60px] object-contain"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSignature(index);
                    }}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-destructive text-destructive-foreground rounded-full transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Main Content - Create New */}
          <div className="flex flex-col overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="draw">
                  <Pen className="w-4 h-4 mr-2" />
                  Draw
                </TabsTrigger>
                <TabsTrigger value="image">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="draw"
                className="flex-1 flex flex-col gap-4 mt-4"
              >
                <div className="flex-1 border rounded-md bg-white relative overflow-hidden touch-none">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-crosshair"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" size="sm" onClick={clearCanvas}>
                    <Eraser className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button size="sm" onClick={saveSignature}>
                    <Plus className="w-4 h-4 mr-2" />
                    Save Signature
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="image"
                className="flex-1 flex flex-col gap-4 mt-4"
              >
                <div className="flex-1 border rounded-md bg-muted/20 flex items-center justify-center relative overflow-hidden">
                  {uploadedImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element -- Dynamic data URL from user upload */
                    <img
                      src={uploadedImage}
                      alt="Uploaded"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                      <p>Upload an image of your signature</p>
                    </div>
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleImageUpload}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadedImage(null)}
                    disabled={!uploadedImage}
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={saveSignature}
                    disabled={!uploadedImage}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Save Signature
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

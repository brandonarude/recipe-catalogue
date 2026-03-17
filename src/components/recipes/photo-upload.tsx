"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { ImagePlus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Photo {
  url: string;
  order: number;
}

interface PhotoUploadProps {
  recipeId: string;
  photos: Photo[];
  onPhotosChange: (photos: Photo[]) => void;
}

export function PhotoUpload({ recipeId, photos, onPhotosChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      try {
        // Get presigned URL
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type }),
        });
        if (!res.ok) throw new Error("Failed to get upload URL");
        const { uploadUrl, publicUrl } = await res.json();

        // Upload to S3
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        });

        // Save photo reference
        const saveRes = await fetch(`/api/recipes/${recipeId}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: publicUrl, order: newPhotos.length }),
        });
        if (!saveRes.ok) throw new Error("Failed to save photo");

        newPhotos.push({ url: publicUrl, order: newPhotos.length });
      } catch {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    onPhotosChange(newPhotos);
    setUploading(false);
  }

  function removePhoto(index: number) {
    const updated = photos.filter((_, i) => i !== index).map((p, i) => ({ ...p, order: i }));
    onPhotosChange(updated);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((photo, index) => (
          <div key={photo.url} className="group relative aspect-square rounded-lg border overflow-hidden">
            <Image
              src={photo.url}
              alt={`Photo ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors">
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
              <GripVertical className="absolute top-1 left-1 h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed hover:border-primary hover:bg-accent transition-colors"
        >
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  );
}

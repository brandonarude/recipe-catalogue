"use client";

import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface PhotoCarouselProps {
  photos: { url: string; order: number }[];
  title: string;
}

export function PhotoCarousel({ photos, title }: PhotoCarouselProps) {
  if (photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <Image
          src={photos[0].url}
          alt={title}
          fill
          className="object-cover"
          priority
        />
      </div>
    );
  }

  return (
    <Carousel className="w-full">
      <CarouselContent>
        {photos.map((photo, i) => (
          <CarouselItem key={photo.url}>
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={photo.url}
                alt={`${title} photo ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  );
}

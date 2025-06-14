"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

export const Case1 = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 1000);
  }, [api, current]);

  return (
    <div className="w-full pt-0 pb-20 lg:pt-0 lg:pb-40">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col gap-10">
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
            Trusted by Maintenance Repair Organizations
            </h2>
            <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
              Join the industry leaders who rely on our MRO Logix Maintenance
            </p>
          </div>
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {Array.from({ length: 10 }).map((_, index) => (
                <CarouselItem className="basis-1/4 lg:basis-1/6" key={index}>
                  <div className="relative rounded-md aspect-square bg-muted overflow-hidden">
                    {index === 0 ? (
                      <Image 
                        src="/cases/logo-1.webp" 
                        alt="Partner Logo 1" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 1 ? (
                      <Image 
                        src="/cases/logo-2.webp" 
                        alt="Partner Logo 2" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 2 ? (
                      <Image 
                        src="/cases/logo-3.webp" 
                        alt="Partner Logo 3" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 3 ? (
                      <Image 
                        src="/cases/logo-4.webp" 
                        alt="Partner Logo 4" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 4 ? (
                      <Image 
                        src="/cases/logo-5.webp" 
                        alt="Partner Logo 5" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 5 ? (
                      <Image 
                        src="/cases/logo-6.webp" 
                        alt="Partner Logo 6" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 6 ? (
                      <Image 
                        src="/cases/logo-7.webp" 
                        alt="Partner Logo 7" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 7 ? (
                      <Image 
                        src="/cases/logo-8.webp" 
                        alt="Partner Logo 8" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 8 ? (
                      <Image 
                        src="/cases/logo-9.webp" 
                        alt="Partner Logo 9" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : index === 9 ? (
                      <Image 
                        src="/cases/logo-10.webp" 
                        alt="Partner Logo 10" 
                        fill
                        sizes="(max-width: 768px) 25vw, 16vw"
                        className="object-cover p-2"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full p-6">
                        <span className="text-sm">Logo {index + 1}</span>
                      </div>
                    )}
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};

// src/components/ImageCarousel.jsx
// Auto-rotating image carousel with blur effect for landing page showcase

import React, { useState, useEffect, useRef } from 'react';

export default function ImageCarousel({
  images = [],
  interval = 3000,
  className = '',
  objectFit = 'cover', // 'cover' crops to fill, 'contain' shows full image
  isActive = true // Controls whether carousel rotates (for viewport-aware rotation)
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const loadedCount = useRef(0);
  const containerRef = useRef(null);

  // Observe visibility - only preload when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Preload images only when near viewport
  useEffect(() => {
    if (!isVisible || images.length === 0) return;

    loadedCount.current = 0;
    setImagesLoaded(false);

    images.forEach((src) => {
      const img = new Image();
      img.onload = () => {
        loadedCount.current += 1;
        if (loadedCount.current === images.length) {
          setImagesLoaded(true);
        }
      };
      img.onerror = () => {
        loadedCount.current += 1;
        if (loadedCount.current === images.length) {
          setImagesLoaded(true);
        }
      };
      img.src = src;
    });
  }, [images, isVisible]);

  // Auto-rotate (only when active)
  useEffect(() => {
    if (images.length <= 1 || !isActive) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, isActive]);

  if (images.length === 0) {
    return <div className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
    >
      {images.map((src, index) => (
        <img
          key={src}
          src={src}
          alt=""
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ${
            objectFit === 'contain' ? 'object-contain' : 'object-cover'
          }`}
          style={{
            opacity: index === currentIndex ? 1 : 0,
          }}
        />
      ))}
      {/* Fallback background while loading */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-slate-100" />
      )}
    </div>
  );
}

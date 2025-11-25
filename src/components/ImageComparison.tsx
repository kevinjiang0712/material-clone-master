'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ImageComparisonProps {
  competitorImage: string;
  productImage: string;
  resultImage: string;
}

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain"
          sizes="100vw"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function ImageComparison({
  competitorImage,
  productImage,
  resultImage,
}: ImageComparisonProps) {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const images = [
    { src: competitorImage, label: '竞品图（参考）', highlight: false },
    { src: productImage, label: '实拍图（原始）', highlight: false },
    { src: resultImage, label: '生成结果', highlight: true },
  ];

  return (
    <>
      <div className="grid md:grid-cols-3 gap-6">
        {images.map((image, index) => (
          <div
            key={index}
            className={`
              bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer
              transition-transform hover:scale-[1.02]
              ${image.highlight ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
            onClick={() => setModalImage({ src: image.src, alt: image.label })}
          >
            <div
              className={`
                px-4 py-3 font-medium
                ${image.highlight ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}
              `}
            >
              {image.label}
            </div>
            <div className="relative aspect-square">
              <Image
                src={image.src}
                alt={image.label}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
          </div>
        ))}
      </div>

      {modalImage && (
        <ImageModal
          src={modalImage.src}
          alt={modalImage.alt}
          onClose={() => setModalImage(null)}
        />
      )}
    </>
  );
}

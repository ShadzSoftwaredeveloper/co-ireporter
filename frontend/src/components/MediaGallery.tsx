import React, { useState } from 'react';
import { MediaFile } from '../types';
import { X, Play, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface MediaGalleryProps {
  media: MediaFile[];
  onRemove?: (id: string) => void;
  editable?: boolean;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ 
  media, 
  onRemove,
  editable = false 
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);

  if (media.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500">No media files attached</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <div key={item.id} className="relative group">
            <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer"
                 onClick={() => setSelectedMedia(item)}>
              {item.type === 'image' ? (
                <img
                  src={item.url}
                  alt="Incident media"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <Play className="w-12 h-12 text-white" />
                  {item.thumbnail && (
                    <img
                      src={item.thumbnail}
                      alt="Video thumbnail"
                      className="absolute inset-0 w-full h-full object-cover opacity-60"
                    />
                  )}
                </div>
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                {item.type === 'video' && (
                  <div className="bg-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-6 h-6 text-gray-900" />
                  </div>
                )}
              </div>
            </div>
            
            {editable && onRemove && (
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 rounded-full p-1 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Media Viewer Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Media Preview</DialogTitle>
          </DialogHeader>
          {selectedMedia && (
            <div className="w-full">
              {selectedMedia.type === 'image' ? (
                <img
                  src={selectedMedia.url}
                  alt="Full size media"
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <video
                  src={selectedMedia.url}
                  controls
                  className="w-full h-auto rounded-lg bg-black"
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

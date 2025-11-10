import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { MapPicker } from '../components/MapPicker';
import { MediaGallery } from '../components/MediaGallery';
import { IncidentType, Location, MediaFile } from '../types';
import { Upload, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export const CreateIncident: React.FC = () => {
  const navigate = useNavigate();
  const { createIncident } = useData();
  const { user } = useAuth();
  
  const [type, setType] = useState<IncidentType>('red-flag');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<Location>({
    lat: 40.7128,
    lng: -74.0060,
  });
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [error, setError] = useState('');

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newMedia: MediaFile[] = [];
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const mediaFile: MediaFile = {
          id: crypto.randomUUID(),
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: reader.result as string,
        };
        newMedia.push(mediaFile);
        
        if (newMedia.length === files.length) {
          setMedia([...media, ...newMedia]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (id: string) => {
    setMedia(media.filter((m) => m.id !== id));
  };

  const handleSubmit = (e: React.FormEvent, status: 'draft' | 'under-investigation') => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    createIncident({
      type,
      title,
      description,
      location,
      media,
      status,
    });

    navigate('/incidents');
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <Alert>
          <AlertDescription>Please sign in to create incidents</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Create New Incident</h1>
        <p className="text-gray-600">
          Report a red-flag (corruption) or request an intervention (infrastructure issue)
        </p>
      </div>

      <form className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Describe the incident you want to report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Incident Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as IncidentType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red-flag">Red-flag (Corruption)</SelectItem>
                  <SelectItem value="intervention">Intervention (Infrastructure)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                {type === 'red-flag' 
                  ? 'Report corruption, bribery, or misuse of public funds'
                  : 'Request repairs or improvements to public infrastructure'
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Brief description of the incident"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed information about the incident..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Specify where the incident occurred</CardDescription>
          </CardHeader>
          <CardContent>
            <MapPicker location={location} onChange={setLocation} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media Attachments</CardTitle>
            <CardDescription>Upload photos or videos as evidence (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="media-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-1">Click to upload images or videos</p>
                  <p className="text-sm text-gray-500">PNG, JPG, GIF, MP4, MOV up to 10MB</p>
                </div>
              </Label>
              <Input
                id="media-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleMediaUpload}
                className="hidden"
              />
            </div>

            {media.length > 0 && (
              <MediaGallery 
                media={media} 
                onRemove={handleRemoveMedia}
                editable
              />
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={(e) => handleSubmit(e, 'draft')}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, 'under-investigation')}
          >
            Submit Incident
          </Button>
        </div>
      </form>
    </div>
  );
};

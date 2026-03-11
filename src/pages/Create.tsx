// VidoMove - Create Page
import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, useAppStore, useContentStore } from '@/store';
import { translations } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { 
  Image, 
  X, 
  Camera,
  Film,
  Plus,
  MapPin,
  Hash,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

type ContentType = 'post' | 'story' | 'reel';

export function CreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuthStore();
  const { language } = useAppStore();
  const { addPost, addStory, addReel } = useContentStore();
  const t = translations[language];
  
  const [contentType, setContentType] = useState<ContentType>(
    (searchParams.get('type') as ContentType) || 'post'
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [step, setStep] = useState<'select' | 'preview' | 'details'>('select');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedFile(url);
      setFileType(file.type.startsWith('video') ? 'video' : 'image');
      setStep('preview');
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = () => {
    if (!selectedFile || !currentUser) return;

    switch (contentType) {
      case 'post':
        addPost({
          userId: currentUser.id,
          mediaUrl: selectedFile,
          caption,
          type: fileType,
        });
        toast.success('Post published!');
        break;
      case 'story':
        addStory({
          userId: currentUser.id,
          mediaUrl: selectedFile,
          type: fileType,
        });
        toast.success('Story added!');
        break;
      case 'reel':
        if (fileType === 'video') {
          addReel({
            userId: currentUser.id,
            videoUrl: selectedFile,
            caption,
          });
          toast.success('Reel published!');
        } else {
          toast.error('Reels must be videos');
          return;
        }
        break;
    }

    navigate('/');
  };

  const renderSelectStep = () => (
    <div className="space-y-6">
      {/* Content Type Selector */}
      <div className="flex justify-center gap-4">
        {(['post', 'story', 'reel'] as ContentType[]).map(type => (
          <button
            key={type}
            onClick={() => setContentType(type)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
              contentType === type 
                ? 'bg-white shadow-lg ring-2 ring-[#59A52C]' 
                : 'bg-white/50 hover:bg-white'
            }`}
          >
            {type === 'post' && <Image className="w-8 h-8" style={{ color: contentType === type ? '#59A52C' : '#6B7280' }} />}
            {type === 'story' && <Camera className="w-8 h-8" style={{ color: contentType === type ? '#59A52C' : '#6B7280' }} />}
            {type === 'reel' && <Film className="w-8 h-8" style={{ color: contentType === type ? '#59A52C' : '#6B7280' }} />}
            <span className={`text-sm font-medium capitalize ${
              contentType === type ? 'text-[#59A52C]' : 'text-gray-600'
            }`}>
              {type}
            </span>
          </button>
        ))}
      </div>

      {/* File Upload Area */}
      <Card 
        onClick={() => fileInputRef.current?.click()}
        className="aspect-square flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#59A52C] hover:bg-gray-50 transition-colors"
      >
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg, #59A52C20 0%, #7CB34220 100%)' }}>
          <Plus className="w-10 h-10 text-[#59A52C]" />
        </div>
        <p className="text-lg font-medium text-gray-700">
          {contentType === 'reel' ? 'Select a video' : 'Select from gallery'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {contentType === 'post' && 'Photos or videos'}
          {contentType === 'story' && 'Photo or video for 24 hours'}
          {contentType === 'reel' && 'Short video up to 90 seconds'}
        </p>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept={contentType === 'reel' ? 'video/*' : 'image/*,video/*'}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  const renderPreviewStep = () => (
    <div className="space-y-4">
      {/* Preview */}
      <div className="relative aspect-square bg-gray-900 rounded-xl overflow-hidden">
        {fileType === 'video' ? (
          <video 
            src={selectedFile!}
            className="w-full h-full object-contain"
            controls
          />
        ) : (
          <img 
            src={selectedFile!}
            alt="Preview"
            className="w-full h-full object-contain"
          />
        )}
        <button
          onClick={() => {
            setSelectedFile(null);
            setStep('select');
          }}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => setStep('select')}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {String(t.back)}
        </Button>
        <Button
          onClick={() => setStep('details')}
          className="flex-1 text-white border-0"
          style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
        >
          {String(t.next)}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Caption */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          {String(t.writeCaption)}
        </label>
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's on your mind?"
          className="min-h-[100px] resize-none"
        />
      </div>

      {/* Location */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {String(t.location)}
        </label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={String(t.addLocation)}
        />
      </div>

      {/* Tags */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
          <Hash className="w-4 h-4" />
          {String(t.tags)}
        </label>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          placeholder={String(t.addTag)}
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(tag => (
              <span 
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#59A52C20] text-[#59A52C] rounded-full text-sm"
              >
                #{tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          onClick={() => setStep('preview')}
          className="flex-1"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {String(t.back)}
        </Button>
        <Button
          onClick={handlePublish}
          className="flex-1 text-white border-0"
          style={{ background: 'linear-gradient(135deg, #59A52C 0%, #7CB342 100%)' }}
        >
          {String(t.post)}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)}>
          <X className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold capitalize">{String(t.create)} {contentType}</h1>
        <div className="w-6" />
      </div>

      {/* Content */}
      {step === 'select' && renderSelectStep()}
      {step === 'preview' && renderPreviewStep()}
      {step === 'details' && renderDetailsStep()}
    </div>
  );
}

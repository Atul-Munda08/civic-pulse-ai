'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Mic, Upload, MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export function ReportIssueDialog() {
  const [open, setOpen] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [classification, setClassification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setClassification(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return null;
    
    setIsClassifying(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      
      const res = await fetch('/api/classify', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.details || 'Failed to classify');
      
      setClassification(data);
      if (data.aiDescription && !description) {
        setDescription(data.aiDescription);
      }
      toast.success('Issue classified by AI');
      return data;
    } catch (error: any) {
      toast.error('AI classification failed: ' + error.message);
      return null;
    } finally {
      setIsClassifying(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please attach an image or video');
      return;
    }
    
    let currentClassification = classification;
    if (!currentClassification) {
      currentClassification = await handleAnalyze();
      if (!currentClassification) {
        return; // Analyze failed
      }
    }

    try {
      // In a real app we'd upload to Storage first, here we simulate
      await addDoc(collection(db, 'issues'), {
        category: currentClassification?.category || 'OTHER',
        subCategory: currentClassification?.subCategory || 'UNKNOWN',
        severity: currentClassification?.severity || 5,
        priorityScore: currentClassification?.severity ? currentClassification.severity * 10 : 50,
        aiConfidence: currentClassification?.confidence || 0.8,
        aiDescription: description || currentClassification?.aiDescription || '',
        riskToLife: currentClassification?.riskToLife || false,
        status: 'AI_CLASSIFIED',
        geoPoint: { lat: 12.9716, lng: 77.5946 }, // Simulated location
        reporterId: auth.currentUser?.uid || 'anonymous', // Linked to authenticated user ID
        reportedAt: serverTimestamp(),
      });
      
      toast.success('Issue reported successfully!');
      setOpen(false);
      setFile(null);
      setPreviewUrl(null);
      setDescription('');
      setClassification(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ size: 'lg' }),
          "bg-civic-primary hover:bg-civic-primary-dark shadow-lg absolute bottom-6 right-6 z-20 rounded-full h-14 px-6 gap-2 text-md"
        )}
      >
        <Camera className="w-5 h-5" />
        Report Issue
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report Civic Issue</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!previewUrl ? (
            <div 
              className="border-2 border-dashed border-border rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Tap to upload image or video</p>
              <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, MP4</p>
            </div>
          ) : (
            <div className="relative rounded-lg overflow-hidden border border-border">
              {file?.type.startsWith('video') ? (
                <video src={previewUrl} className="w-full max-h-48 object-cover" controls />
              ) : (
                <Image src={previewUrl} alt="Preview" width={400} height={200} className="w-full max-h-48 object-cover" unoptimized />
              )}
              <Button 
                size="sm" 
                variant="secondary" 
                className="absolute top-2 right-2 shadow-sm"
                onClick={() => { setFile(null); setPreviewUrl(null); setClassification(null); }}
              >
                Change
              </Button>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*"
            onChange={handleFileSelect}
          />

          <div className="space-y-2">
            <Label htmlFor="desc">Description (Optional)</Label>
            <div className="relative">
              <Textarea 
                id="desc" 
                placeholder="What seems to be the problem?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="pr-10"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute bottom-2 right-2 h-6 w-6 rounded-full"
                onClick={() => toast.info('Voice transcription simulated')}
              >
                <Mic className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {classification && (
            <div className="bg-muted p-3 rounded-lg border border-border space-y-2 text-sm">
              <div className="flex justify-between items-center font-medium">
                <span className="text-civic-primary">AI Classification</span>
                <span className="text-xs text-muted-foreground">{(classification.confidence * 100).toFixed(0)}% Match</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Category:</span> {classification.category}</div>
                <div><span className="text-muted-foreground">Severity:</span> {classification.severity}/10</div>
              </div>
              {classification.riskToLife && (
                <div className="text-civic-critical font-bold mt-1 text-xs uppercase flex items-center gap-1">
                  ⚠️ Risk to Life Detected
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleAnalyze}
            disabled={!file || isClassifying}
          >
            {isClassifying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isClassifying ? 'Analyzing...' : 'AI Analyze'}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!file}
            className="bg-civic-primary hover:bg-civic-primary-dark text-primary-foreground"
          >
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

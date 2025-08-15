'use client';

import { useState, useTransition, useRef } from 'react';
import Image from 'next/image';
import {
  classifyBusinessType,
  ClassifyBusinessTypeInput,
} from '@/ai/flows/classify-business-type';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  UploadCloud,
  X,
  Wand2,
  Loader2,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

const MAX_FILES = 5;

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [classification, setClassification] = useState<string | null>(null);
  const [userClassification, setUserClassification] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const resetState = () => {
    setFiles([]);
    setPreviews([]);
    setClassification(null);
    setUserClassification('');
    setError(null);
    setIsConfirmed(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (files.length + newFiles.length > MAX_FILES) {
        setError(`You can only upload a maximum of ${MAX_FILES} images.`);
        return;
      }
      setError(null);
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);

      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      const newPreviews = prev.filter((_, i) => i !== index);
      URL.revokeObjectURL(previews[index]); // Clean up memory
      return newPreviews;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleClassify = () => {
    if (files.length === 0) {
      setError('Please upload at least one image.');
      return;
    }
    setError(null);
    setClassification(null);
    setUserClassification('');

    startTransition(async () => {
      try {
        const base64Images = await Promise.all(files.map(toBase64));
        const input: ClassifyBusinessTypeInput = {};
        base64Images.forEach((img, i) => {
          input[`image${i + 1}` as keyof ClassifyBusinessTypeInput] = img;
        });

        const result = await classifyBusinessType(input);
        
        if (result && result.businessType) {
          setClassification(result.businessType);
          setUserClassification(result.businessType);
        } else {
          throw new Error('Classification failed to return a business type.');
        }

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
        setError(`Classification failed: ${errorMessage}`);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Classification failed. ${errorMessage}`,
        });
      }
    });
  };

  const handleConfirm = () => {
    setIsConfirmed(true);
    toast({
      title: 'Success!',
      description: `Merchant onboarded with business type: "${userClassification}".`,
      className: 'bg-primary text-primary-foreground'
    });
  };


  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold tracking-tight">
            QRIS Classifier
          </CardTitle>
          <CardDescription>
            Upload up to 5 images to classify a business environment using AI.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isConfirmed ? (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-8 text-center">
              <CheckCircle className="h-16 w-16 text-primary" />
              <h3 className="text-xl font-semibold">Onboarding Complete!</h3>
              <p className="text-muted-foreground">
                Merchant classified as: <strong>{userClassification}</strong>
              </p>
            </div>
          ) : (
            <>
              <div>
                <Label
                  htmlFor="image-upload"
                  className="flex cursor-pointer flex-col items-center justify-center space-y-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground" />
                  <span className="font-medium">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-sm text-muted-foreground">
                    (Max {MAX_FILES} images)
                  </span>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  ref={fileInputRef}
                  disabled={isPending || files.length >= MAX_FILES}
                />
              </div>

              {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {previews.map((src, index) => (
                    <div key={index} className="relative group aspect-square">
                      <Image
                        src={src}
                        alt={`Preview ${index + 1}`}
                        width={150}
                        height={150}
                        className="h-full w-full rounded-md object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => removeImage(index)}
                        disabled={isPending}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove image</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {classification && (
                <div className="space-y-4 rounded-lg border bg-card p-4">
                  <Label htmlFor="business-type" className="font-semibold">AI Classification Result</Label>
                  <Input
                    id="business-type"
                    value={userClassification}
                    onChange={(e) => setUserClassification(e.target.value)}
                    placeholder="e.g., Toko Sepatu, Toko Kue"
                    disabled={isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    Confirm the suggested business type or adjust it as needed.
                  </p>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          {isConfirmed ? (
            <Button onClick={resetState}>Start New Classification</Button>
          ) : (
            <>
              {(files.length > 0 || classification) && (
                <Button variant="outline" onClick={resetState} disabled={isPending}>
                  Clear
                </Button>
              )}
              {classification ? (
                <Button onClick={handleConfirm} disabled={isPending || !userClassification}>
                  Confirm Classification
                </Button>
              ) : (
                <Button onClick={handleClassify} disabled={isPending || files.length === 0}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="mr-2 h-4 w-4" />
                  )}
                  {isPending ? 'Classifying...' : 'Classify Business'}
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>
    </main>
  );
}

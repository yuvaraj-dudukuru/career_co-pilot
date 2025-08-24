import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select } from '../components/ui/select';
import { Upload, FileText, Lightbulb, Target, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface FormData {
  resumeText: string;
  interests: string;
  goal: string;
}

const careerGoals = [
  'AI & Machine Learning',
  'Cloud & DevOps',
  'Full-Stack Development',
  'Data Science & Analytics',
  'Mobile Development',
  'Cybersecurity',
  'Product Management',
  'UX/UI Design',
  'Blockchain & Web3',
  'Game Development'
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    resumeText: '',
    interests: '',
    goal: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle PDF file upload and parsing
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      setFormData(prev => ({ ...prev, resumeText: fullText.trim() }));
      
    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError('Failed to parse PDF. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.resumeText || !formData.interests || !formData.goal) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/generate-roadmap`, formData);
      
      // Store the roadmap data in localStorage for the dashboard
      localStorage.setItem('careerRoadmap', JSON.stringify(response.data));
      
      // Navigate to dashboard
      navigate('/dashboard');
      
    } catch (err: any) {
      console.error('Error generating roadmap:', err);
      setError(err.response?.data?.error || 'Failed to generate roadmap. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, navigate]);

  // Navigation functions
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // Step validation
  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.resumeText.length > 0;
      case 2: return formData.interests.length > 0;
      case 3: return formData.goal.length > 0;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Upload Your Resume</CardTitle>
              <p className="text-muted-foreground">
                Upload your resume (PDF) to help us understand your current skills and experience
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing PDF...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose PDF File
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Drag and drop your resume here, or click to browse
                </p>
              </div>
              
              {formData.resumeText && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">Resume uploaded successfully!</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    {formData.resumeText.length} characters extracted
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Lightbulb className="w-8 h-8 text-yellow-600" />
              </div>
              <CardTitle className="text-2xl">What Excites You?</CardTitle>
              <p className="text-muted-foreground">
                Tell us about the technologies and problems that genuinely interest you
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Textarea
                placeholder="For example: I'm passionate about building scalable web applications, solving complex data problems, and working with cutting-edge AI technologies. I enjoy creating user experiences that make a real difference in people's lives..."
                value={formData.interests}
                onChange={(e) => setFormData(prev => ({ ...prev, interests: e.target.value }))}
                className="min-h-[120px] text-lg"
              />
              <div className="text-sm text-muted-foreground">
                <p>💡 Be specific about:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Technologies you want to work with</li>
                  <li>Types of problems you enjoy solving</li>
                  <li>Industries or domains that interest you</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Set Your Career Goal</CardTitle>
              <p className="text-muted-foreground">
                Choose the career path you want to pursue
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select
                value={formData.goal}
                onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                className="text-lg"
              >
                <option value="">Select a career goal...</option>
                {careerGoals.map((goal) => (
                  <option key={goal} value={goal}>{goal}</option>
                ))}
              </Select>
              
              <div className="text-sm text-muted-foreground">
                <p>🎯 This will help us create a personalized learning roadmap tailored to your specific career aspirations.</p>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🚀 Career Advisor
          </h1>
          <p className="text-xl text-gray-600">
            Your Personalized Skills Roadmap
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 3</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 3) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8 max-w-2xl mx-auto">
          <Button
            onClick={prevStep}
            variant="outline"
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 3 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isLoading}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Roadmap...
                </>
              ) : (
                '🚀 Generate My Roadmap'
              )}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 max-w-2xl mx-auto">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="text-center text-destructive">
                  <p className="font-medium">⚠️ Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardingPage;

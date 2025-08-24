import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import ProfileSummary from '../components/ProfileSummary';
import SkillGraph from '../components/SkillGraph';

interface RoadmapData {
  nodes: any[];
  edges: any[];
  profileSummary: string;
}

function DashboardPage() {
  const navigate = useNavigate();
  const [roadmapData, setRoadmapData] = useState<RoadmapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load roadmap data from localStorage
    const storedData = localStorage.getItem('careerRoadmap');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setRoadmapData(parsedData);
      } catch (err) {
        console.error('Error parsing stored roadmap data:', err);
        setError('Failed to load roadmap data');
      }
    } else {
      setError('No roadmap data found. Please start over.');
    }
    setIsLoading(false);
  }, []);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized roadmap...</p>
        </div>
      </div>
    );
  }

  if (error || !roadmapData) {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error || 'Unable to load roadmap data'}</p>
            <div className="space-x-4">
              <Button onClick={handleGoBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Start Over
              </Button>
              <Button onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎯 Your Career Roadmap
            </h1>
            <p className="text-xl text-gray-600">
              Personalized learning path to your career goals
            </p>
          </div>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Start Over
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Summary */}
          <div className="lg:col-span-1">
            <ProfileSummary summary={roadmapData.profileSummary} />
          </div>

          {/* Right Column - Skill Graph */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">🗺️ Skills Roadmap</CardTitle>
                <p className="text-muted-foreground">
                  Interactive visualization of your learning journey. Click on any skill node to see details and resources.
                </p>
              </CardHeader>
              <CardContent>
                <SkillGraph 
                  nodes={roadmapData.nodes} 
                  edges={roadmapData.edges} 
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">How to use your roadmap:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span>Current skills you already have</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span>Skills you need to learn</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
                    <span>Your target career goal</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  💡 Click on any skill node to see detailed descriptions and curated learning resources!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

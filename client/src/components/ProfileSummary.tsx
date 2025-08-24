import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { User, Target, TrendingUp, BookOpen } from 'lucide-react';

interface ProfileSummaryProps {
  summary: string;
}

function ProfileSummary({ summary }: ProfileSummaryProps) {
  return (
    <div className="space-y-6">
      {/* Profile Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Career Profile Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed">
            {summary}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-blue-800">Steps to Goal</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">5+</div>
              <div className="text-sm text-green-800">Skills to Learn</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-medium">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Review your roadmap</p>
                <p className="text-sm text-gray-600">Explore the interactive skill graph to understand your learning path</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-medium">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Click skill nodes</p>
                <p className="text-sm text-gray-600">Get detailed descriptions and curated learning resources for each skill</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-medium">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Start learning</p>
                <p className="text-sm text-gray-600">Begin with foundational skills and work your way up to advanced topics</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>🎯 <strong>Focus on one skill at a time</strong> - Master the fundamentals before moving to advanced topics</p>
            <p>📚 <strong>Practice regularly</strong> - Consistent learning beats intensive cramming</p>
            <p>🔗 <strong>Build projects</strong> - Apply what you learn to real-world scenarios</p>
            <p>📈 <strong>Track progress</strong> - Celebrate small wins and milestones</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileSummary;

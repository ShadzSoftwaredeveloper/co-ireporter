import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AlertCircle, MapPin, FileText, Shield, Users } from 'lucide-react';

export const Welcome: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <AlertCircle className="w-20 h-20 text-red-600" />
          </div>
          <h1 className="text-gray-900 mb-4">iReporter</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Report corruption, request interventions, and make your community better.
            A platform for civic engagement and transparency.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <AlertCircle className="w-10 h-10 text-red-600 mb-3" />
              <CardTitle>Report Red-flags</CardTitle>
              <CardDescription>
                Expose corruption, bribery, and misuse of public funds
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <FileText className="w-10 h-10 text-orange-600 mb-3" />
              <CardTitle>Request Interventions</CardTitle>
              <CardDescription>
                Report infrastructure issues and request repairs
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="w-10 h-10 text-blue-600 mb-3" />
              <CardTitle>Geolocation</CardTitle>
              <CardDescription>
                Pin exact locations with interactive maps
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-10 h-10 text-green-600 mb-3" />
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor status updates and admin responses
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  1
                </div>
                <h3 className="text-gray-900 mb-2">Create Account</h3>
                <p className="text-gray-600">
                  Sign up with your email to start reporting incidents
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  2
                </div>
                <h3 className="text-gray-900 mb-2">Report Incident</h3>
                <p className="text-gray-600">
                  Describe the issue, add location, and upload evidence
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  3
                </div>
                <h3 className="text-gray-900 mb-2">Track Progress</h3>
                <p className="text-gray-600">
                  Monitor your reports and receive updates from admins
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Info */}
        <div className="text-center mt-12 p-6 bg-white rounded-lg shadow-sm max-w-2xl mx-auto">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-3">Demo Application</h3>
          <p className="text-gray-600 mb-4">
            This is a demonstration application built with React and TypeScript.
            All data is stored locally in your browser.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Demo User: user@demo.com / password</p>
            <p>Demo Admin: admin@demo.com / admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

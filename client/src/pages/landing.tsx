import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, BarChart3, Users, Settings } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Store className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            POS SaaS Admin Dashboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Comprehensive management platform for multi-tenant Point of Sale system.
            Manage shops, subscriptions, employees, and analytics from one place.
          </p>
          <Button 
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-3"
            data-testid="button-login"
          >
            Login as Super Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center">
            <CardHeader>
              <Store className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Shop Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Manage all retail shops and salons with complete control over subscriptions and licensing.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time analytics on revenue, storage usage, server performance, and growth metrics.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Employee Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Track sales team performance, manage salaries, and monitor assigned areas.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Settings className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>System Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-300">
                Handle complaints, maintenance tasks, office expenses, and system backups.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Secure authentication required • Pakistan-based business solution
          </p>
        </div>
      </div>
    </div>
  );
}

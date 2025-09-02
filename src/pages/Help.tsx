import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageDisplayFixComponent } from "@/components/ImageDisplayFixComponent"

const Help = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Help & Support</h1>
      
      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-muted-foreground">
            <p>Welcome to your ORB Trading Journal!</p>
            <p>This application helps you track your Opening Range Breakout strategies across different forex sessions.</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Use the Dashboard to view your overall performance</li>
              <li>Check Stats for detailed analytics</li>
              <li>Navigate to individual sessions to log trade ideas</li>
              <li>Use the Calendar to view your trading history</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-muted-foreground">
            <p>If you're experiencing issues with image display in trade reviews:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Images may not display if storage policies are incorrectly configured</li>
              <li>Use the tool below to fix image display policies</li>
              <li>This will ensure images uploaded to the trade-screenshots bucket can be viewed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <ImageDisplayFixComponent />
    </div>
 )
}

export default Help

import { TradingDashboard } from "@/components/TradingDashboard";
import { StorageTestComponent } from "@/components/StorageTestComponent";
import { ExistingTradesImageDebug } from "@/components/ExistingTradesImageDebug";
import { BucketSetupComponent } from "@/components/BucketSetupComponent";
import { RLSFixComponent } from "@/components/RLSFixComponent";
import { TradeReviewImageTest } from "@/components/TradeReviewImageTest";
import { DirectRLSFix } from "@/components/DirectRLSFix";

const Index = () => {
  return (
    <div className="space-y-6">
      <TradingDashboard />
      {/* Temporary debug components - remove after debugging */}
      <div className="border-t pt-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">🚑 Direct RLS Fix (Try This First!)</h3>
          <DirectRLSFix />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">🚨 Alternative RLS Fix</h3>
          <RLSFixComponent />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">🔧 Bucket Setup</h3>
          <BucketSetupComponent />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">🖼️ Trade Review Image Test</h3>
          <TradeReviewImageTest />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Debug: Storage Test</h3>
          <StorageTestComponent />
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-4">Debug: Existing Trades Images</h3>
          <ExistingTradesImageDebug />
        </div>
      </div>
    </div>
  );
};
export default Index;
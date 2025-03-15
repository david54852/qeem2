"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ArrowUpRight,
  DollarSign,
  Landmark,
  Home,
  Coins,
  CreditCard,
} from "lucide-react";

interface AssetCategoryWidgetClientProps {
  title: string;
  iconName: "DollarSign" | "Landmark" | "Home" | "Coins" | "CreditCard";
  totalValue: number;
  changePercentage?: number;
  assetCount: number;
}

export default function AssetCategoryWidgetClient({
  title = "Category",
  iconName,
  totalValue = 0,
  changePercentage = 0,
  assetCount = 0,
}: AssetCategoryWidgetClientProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPositiveChange = changePercentage >= 0;

  // Map icon names to their components
  const getIcon = () => {
    switch (iconName) {
      case "DollarSign":
        return <DollarSign className="h-5 w-5 text-blue-600" />;
      case "Landmark":
        return <Landmark className="h-5 w-5 text-blue-600" />;
      case "Home":
        return <Home className="h-5 w-5 text-blue-600" />;
      case "Coins":
        return <Coins className="h-5 w-5 text-blue-600" />;
      case "CreditCard":
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      default:
        return <DollarSign className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card className="bg-white hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full">{getIcon()}</div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => {}}>
            <PlusCircle className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{formatCurrency(totalValue)}</h3>

          {changePercentage !== 0 && (
            <div
              className={`flex items-center ${isPositiveChange ? "text-green-600" : "text-red-600"}`}
            >
              {isPositiveChange ? (
                <ArrowUpRight className="h-4 w-4 mr-1" />
              ) : (
                <ArrowUpRight className="h-4 w-4 mr-1 transform rotate-90" />
              )}
              <span className="text-sm">
                {Math.abs(changePercentage).toFixed(1)}% this month
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              {assetCount} {assetCount === 1 ? "asset" : "assets"}
            </span>
            <Button
              variant="link"
              size="sm"
              onClick={() => {}}
              className="p-0 h-auto"
            >
              View details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

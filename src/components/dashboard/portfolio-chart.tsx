"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useRef, useState } from "react";

interface PortfolioChartProps {
  totalAssets?: number;
  totalLiabilities?: number;
  className?: string;
}

export default function PortfolioChart({
  totalAssets = 0,
  totalLiabilities = 0,
  className = "",
}: PortfolioChartProps) {
  const [timeframe, setTimeframe] = useState("1m");
  // Add support for more timeframes
  const timeframeMap = {
    "1d": 1,
    "7d": 7,
    "1m": 30,
    ytd: Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 1)) /
        (1000 * 60 * 60 * 24),
    ),
    "1y": 365,
    all: 730,
  };
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const netWorth = totalAssets - totalLiabilities;

  // Generate sample historical data based on current values
  const generateHistoricalData = () => {
    const now = new Date();
    const data = [];

    // Number of data points based on timeframe
    let days = timeframeMap[timeframe] || 30; // Use the timeframe map

    // Starting value (current net worth minus some growth)
    const startingValue = netWorth * 0.8;
    const growth = netWorth - startingValue;

    // Generate data points
    for (let i = 0; i <= days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - i));

      // Create a slightly random growth curve
      const progress = i / days;
      const randomFactor = 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
      const value = startingValue + growth * progress * progress * randomFactor;

      data.push({
        date,
        value: Math.max(0, value),
      });
    }

    return data;
  };

  // Draw the chart
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Generate data
    const data = generateHistoricalData();
    if (data.length === 0) return;

    // Set canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min and max values for scaling
    const values = data.map((d) => d.value);
    const maxValue = Math.max(...values) * 1.1; // Add 10% padding
    const minValue = Math.min(0, Math.min(...values) * 0.9); // Include zero

    // Calculate scaling factors
    const xScale = width / (data.length - 1);
    const yScale = height / (maxValue - minValue);

    // Draw axes
    ctx.strokeStyle = "#e5e7eb"; // Light gray
    ctx.lineWidth = 1;

    // Draw horizontal grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
      const y = height - i * (height / gridLines);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      // Add value labels
      const value = minValue + i * ((maxValue - minValue) / gridLines);
      ctx.fillStyle = "#9ca3af"; // Gray
      ctx.font = "10px Arial";
      ctx.textAlign = "left";
      ctx.fillText(
        new Intl.NumberFormat("fr-FR", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 0,
        }).format(value),
        5,
        y - 5,
      );
    }

    // Draw the line
    ctx.beginPath();
    ctx.moveTo(0, height - (data[0].value - minValue) * yScale);

    for (let i = 1; i < data.length; i++) {
      const x = i * xScale;
      const y = height - (data[i].value - minValue) * yScale;
      ctx.lineTo(x, y);
    }

    // Style the line
    ctx.strokeStyle = "#f59e0b"; // Amber/Orange color
    ctx.lineWidth = 2;
    ctx.stroke();

    // Fill area under the line
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = "rgba(245, 158, 11, 0.1)"; // Light amber
    ctx.fill();

    // Add date markers
    ctx.fillStyle = "#9ca3af"; // Gray
    ctx.font = "10px Arial";
    ctx.textAlign = "center";

    const dateMarkers = 6; // Number of date markers to show
    for (let i = 0; i <= dateMarkers; i++) {
      const index = Math.floor((i * (data.length - 1)) / dateMarkers);
      const x = index * xScale;
      const date = data[index].date;
      ctx.fillText(date.toLocaleDateString("fr-FR"), x, height - 5);
    }
  }, [timeframe, netWorth, totalAssets, totalLiabilities]);

  // Calculate growth percentage
  const historicalData = generateHistoricalData();
  const startingValue = historicalData.length > 0 ? historicalData[0].value : 0;
  const growthAmount = netWorth - startingValue;
  const growthPercentage =
    startingValue > 0 ? (growthAmount / startingValue) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Net Worth</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {new Date().toLocaleDateString("fr-FR")}
            </p>
            <p className="text-3xl font-bold mt-2">
              {new Intl.NumberFormat("fr-FR", {
                style: "currency",
                currency: "EUR",
                maximumFractionDigits: 0,
              }).format(netWorth)}
            </p>
          </div>
          <Tabs
            defaultValue="1m"
            value={timeframe}
            onValueChange={setTimeframe}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-6 w-[300px]">
              <TabsTrigger value="1d">1D</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="1m">1M</TabsTrigger>
              <TabsTrigger value="ytd">YTD</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
              <TabsTrigger value="all">ALL</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {netWorth > 0 ? (
          <>
            <canvas
              ref={canvasRef}
              width={1000}
              height={300}
              className="w-full h-auto"
            />
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Starting Value</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(startingValue)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Current Net Worth</p>
                <p className="font-medium">
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(netWorth)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Growth</p>
                <p
                  className={`font-medium ${growthAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {growthAmount >= 0 ? "+" : ""}
                  {new Intl.NumberFormat("fr-FR", {
                    style: "currency",
                    currency: "EUR",
                    maximumFractionDigits: 0,
                  }).format(growthAmount)}{" "}
                  ({growthAmount >= 0 ? "+" : ""}
                  {growthPercentage.toFixed(1)}%)
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-md">
            <p className="text-muted-foreground text-sm">
              Add assets to see your net worth growth
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

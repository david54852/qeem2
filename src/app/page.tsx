import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import PricingCard from "@/components/pricing-card";
import Footer from "@/components/footer";
import { createClient } from "../../supabase/server";
import {
  ArrowUpRight,
  ChartPieIcon,
  BarChart4,
  LineChart,
  Shield,
  DollarSign,
  Landmark,
  Home,
  Coins,
  CreditCard,
} from "lucide-react";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: plans, error } = await supabase.functions.invoke(
    "supabase-functions-get-plans",
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Complete Financial Management
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Track, analyze, and optimize your entire financial portfolio in
              one powerful dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <ChartPieIcon className="w-6 h-6" />,
                title: "Asset Allocation",
                description:
                  "Visualize your portfolio distribution across asset classes",
              },
              {
                icon: <LineChart className="w-6 h-6" />,
                title: "Performance Tracking",
                description:
                  "Monitor growth and returns over customizable time periods",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Bank-Grade Security",
                description:
                  "Your financial data is protected with enterprise encryption",
              },
              {
                icon: <BarChart4 className="w-6 h-6" />,
                title: "Insightful Analytics",
                description:
                  "Gain valuable insights with advanced financial metrics",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Asset Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Track All Your Assets</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our comprehensive platform supports all major asset classes in one
              unified dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              {
                icon: <DollarSign className="w-8 h-8" />,
                title: "Cash",
                description: "Bank accounts, savings, and liquid assets",
              },
              {
                icon: <Landmark className="w-8 h-8" />,
                title: "Investments",
                description: "Stocks, bonds, ETFs, and mutual funds",
              },
              {
                icon: <Home className="w-8 h-8" />,
                title: "Real Estate",
                description: "Properties, mortgages, and REITs",
              },
              {
                icon: <Coins className="w-8 h-8" />,
                title: "Cryptocurrency",
                description: "Bitcoin, Ethereum, and other digital assets",
              },
              {
                icon: <CreditCard className="w-8 h-8" />,
                title: "Debt",
                description: "Credit cards, loans, and liabilities",
              },
            ].map((category, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-blue-600 mb-4 flex justify-center">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">$2B+</div>
              <div className="text-blue-100">Assets Tracked</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime Reliability</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Choose the perfect plan for your financial journey. No hidden
              fees.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans?.map((item: any) => (
              <PricingCard key={item.id} item={item} user={user} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Take Control of Your Financial Future
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of investors who trust our platform to manage their
            complete financial portfolio.
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started Now
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}

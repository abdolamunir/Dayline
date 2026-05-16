import React from 'react';

const integrations = [
  {
    name: 'Shopify',
    logo: 'https://logo.clearbit.com/shopify.com',
    description: 'Connect your Shopify store to streamline product management and automate order handling with AI.'
  },
  {
    name: 'WooCommerce',
    logo: 'https://logo.clearbit.com/woocommerce.com',
    description: 'Sync WooCommerce with AI-powered tools to simplify checkout, cart recovery, and customer engagement.'
  },
  {
    name: 'Magento',
    logo: 'https://logo.clearbit.com/magento.com',
    description: 'AI-driven product recommendations and smarter catalog management tailored for Magento stores.'
  },
  {
    name: 'BigCommerce',
    logo: 'https://logo.clearbit.com/bigcommerce.com',
    description: 'Integrate BigCommerce and let AI optimize promotions, upsells, and customer journeys.'
  },
  {
    name: 'Amazon Seller Central',
    logo: 'https://logo.clearbit.com/amazon.com',
    description: 'Connect your Amazon listings and use AI to automate pricing, inventory, and review monitoring.'
  },
  {
    name: 'eBay',
    logo: 'https://logo.clearbit.com/ebay.com',
    description: 'Manage eBay sales with AI that automates bidding, pricing updates, and customer messages.'
  },
  {
    name: 'Google Shopping',
    logo: 'https://logo.clearbit.com/google.com',
    description: 'Boost visibility by syncing your catalog and letting AI optimize ads & product placement.'
  },
  {
    name: 'Facebook Shops',
    logo: 'https://logo.clearbit.com/facebook.com',
    description: 'Sell directly on social platforms with AI automation for catalog sync, ads, and retargeting.'
  },
  {
    name: 'TikTok Shop',
    logo: 'https://logo.clearbit.com/tiktok.com',
    description: 'Leverage AI for viral campaigns, smart targeting, and seamless TikTok shop automation.'
  }
];

export function Integrations() {
  return (
    <div className="min-h-screen bg-[var(--tokyo-bg-deep)] text-white p-8 md:p-16 lg:p-24 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <p className="text-xs text-[var(--tokyo-text-faint)] tracking-[0.3em] mb-6 flex items-center gap-2">
            <span className="opacity-50">#</span>
            Seamless connectivity
            <span className="opacity-50">#</span>
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">Integration Sources</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {integrations.map((item) => (
            <div 
              key={item.name}
              className="bg-[var(--tokyo-panel)] border border-white/[0.03] rounded-[2.5rem] p-10 flex flex-col hover:bg-white/[0.02] transition-all duration-500 group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-10 overflow-hidden shadow-2xl shadow-white/5">
                <img 
                  src={item.logo} 
                  alt={item.name} 
                  className="w-8 h-8 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-[var(--tokyo-text-strong)] group-hover:text-white transition-colors">{item.name}</h3>
              
              <p className="text-[15px] text-[var(--tokyo-text-faint)] leading-relaxed mb-12 flex-1 group-hover:text-[var(--tokyo-text-muted)] transition-colors">
                {item.description}
              </p>
              
              <button className="text-[13px] font-bold flex items-center gap-1.5 text-[var(--tokyo-text-strong)] group-hover:text-white transition-all">
                Enable Source 
                <span className="text-lg leading-none opacity-60 group-hover:opacity-100 transition-opacity">›</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import { Lock, Sparkles, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function UpgradeBanner({ title = 'Upgrade to Pro', description = 'Unlock premium features to grow your business.' }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Dynamically load Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    }
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subscribe', { method: 'POST' });
      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.subscription_id && data.key_id) {
        const options = {
          key: data.key_id,
          subscription_id: data.subscription_id,
          name: 'LanceLedger',
          description: 'Pro Subscription',
          handler: function (response) {
            window.location.href = `/settings?success=true&subscription_id=${response.razorpay_subscription_id}`;
          },
          theme: {
            color: '#6366f1' // Using our tailwind indigo-500 equivalent primary color
          }
        };

        const rzp1 = new window.Razorpay(options);
        rzp1.on('payment.failed', function (response){
           alert('Payment Failed: ' + response.error.description);
        });
        rzp1.open();
      } else {
        throw new Error('Failed to start checkout');
      }
    } catch (err) {
      console.error(err);
      alert('Could not start checkout session. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full relative overflow-hidden rounded-2xl p-8 bg-gradient-to-br from-card to-card/50 border border-border shadow-2xl flex flex-col items-center justify-center text-center gap-6 group">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors duration-500" />

      <div className="relative z-10 w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner mb-2 border border-primary/20">
        <Lock className="w-8 h-8" />
      </div>

      <div className="relative z-10 space-y-2 max-w-md">
        <h3 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent flex justify-center items-center gap-2">
          {title} <Sparkles className="w-5 h-5 text-amber-400" />
        </h3>
        <p className="text-foreground/70">{description}</p>
      </div>

      <button
        onClick={handleUpgrade}
        disabled={loading}
        className="relative z-10 mt-4 px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 flex items-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Get LanceLedger Pro for $20/mo'}
      </button>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { useTrans } from '../i18n';

export default function TermsOfServicePage() {
  const { isNp } = useTrans();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/signup"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-smooth mb-6"
        >
          <ArrowLeft size={16} />
          {isNp ? 'साइन अपमा फर्कनुहोस्' : 'Back to Sign Up'}
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Shield size={20} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
                {isNp ? 'सेवाका शर्तहरू' : 'Terms of Service'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isNp ? 'अन्तिम अपडेट: जून २०२६' : 'Last updated: June 2026'}
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '१. स्वीकृति' : '1. Acceptance of Terms'}
              </h2>
              <p>
                {isNp
                  ? 'हाम्रो कर्म प्लेटफर्म प्रयोग गरेर, तपाईंले यी सेवाका शर्तहरू पालना गर्न सहमति जनाउनुहुन्छ। यदि तपाईं सहमत हुनुहुन्न भने, कृपया प्लेटफर्म प्रयोग नगर्नुहोस्।'
                  : 'By accessing or using the Hamro Karma platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '२. प्लेटफर्मको विवरण' : '2. Description of Platform'}
              </h2>
              <p>
                {isNp
                  ? 'हाम्रो कर्म नेपालमा ग्राहकहरू र स्थानीय सेवा प्रदायकहरूलाई जोड्ने कर्म-आधारित सेवा बजार हो। हामी प्लम्बर, इलेक्ट्रिसियन, सफाइकर्मी, बढई, र अन्य पेशेवरहरूलाई ग्राहकहरूसँग जोड्न मद्दत गर्छौं।'
                  : 'Hamro Karma is a karma-based service marketplace connecting customers with local service providers in Nepal. We facilitate connections between customers and professionals including plumbers, electricians, cleaners, carpenters, and other skilled workers.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '३. प्रयोगकर्ता खाता' : '3. User Accounts'}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{isNp ? 'तपाईंले सही र पूर्ण जानकारी प्रदान गर्नुपर्छ।' : 'You must provide accurate and complete registration information.'}</li>
                <li>{isNp ? 'तपाईंको खाताको सुरक्षा तपाईंको जिम्मेवारी हो।' : 'You are responsible for maintaining the security of your account.'}</li>
                <li>{isNp ? 'प्रत्येक व्यक्तिको एउटा मात्र खाता हुनुपर्छ।' : 'Each individual may maintain only one account.'}</li>
                <li>{isNp ? 'तपाईं कम्तीमा १६ वर्षको हुनुपर्छ।' : 'You must be at least 16 years of age to create an account.'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '४. कर्म प्रणाली' : '4. Karma System'}
              </h2>
              <p>
                {isNp
                  ? 'कर्म अंकहरू सेवा गुणस्तर, ग्राहक सन्तुष्टि र समुदायमा योगदानको आधारमा प्रदान गरिन्छ। कर्म अंकहरू हस्तान्तरणयोग्य छैनन् र कुनै नगद मूल्य छैन।'
                  : 'Karma points are awarded based on service quality, customer satisfaction, and community contributions. Karma points are non-transferable and hold no cash value.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '५. भुक्तानी र शुल्क' : '5. Payments & Fees'}
              </h2>
              <p>
                {isNp
                  ? 'सेवा प्रदायकहरू र ग्राहकहरू बीचको भुक्तानी प्लेटफर्ममा सहमत मूल्य अनुसार हुन्छ। हाम्रो कर्मले कुनै कमिशन लिन सक्छ। सबै मूल्य नेपाली रुपैयाँमा हुन्छ।'
                  : 'Payments between service providers and customers are processed through agreed-upon rates on the platform. Hamro Karma may charge a commission fee. All prices are in Nepalese Rupees (NPR).'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '६. निषेधित गतिविधिहरू' : '6. Prohibited Activities'}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{isNp ? 'झूटो वा भ्रामक जानकारी प्रदान गर्नु' : 'Providing false or misleading information'}</li>
                <li>{isNp ? 'अन्य प्रयोगकर्तालाई उत्पीडन वा दुर्व्यवहार गर्नु' : 'Harassing or abusing other users'}</li>
                <li>{isNp ? 'कर्म प्रणालीमा हेरफेर गर्नु' : 'Manipulating the karma system'}</li>
                <li>{isNp ? 'प्लेटफर्म बाहिर भुक्तानी गर्नु' : 'Processing payments outside the platform'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '७. सम्पर्क' : '7. Contact'}
              </h2>
              <p>
                {isNp
                  ? 'यी शर्तहरूको बारेमा प्रश्नहरूको लागि, कृपया support@hamrokarma.com मा सम्पर्क गर्नुहोस्।'
                  : 'For questions about these terms, please contact us at support@hamrokarma.com.'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

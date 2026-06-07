import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { useTrans } from '../i18n';

export default function TermsAndConditionsPage() {
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
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <FileText size={20} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-slate-900 dark:text-slate-100">
                {isNp ? 'नियम र सर्तहरू' : 'Terms & Conditions'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isNp ? 'अन्तिम अपडेट: जून २०२६' : 'Last updated: June 2026'}
              </p>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none space-y-6 text-slate-700 dark:text-slate-300">
            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '१. सामान्य सर्तहरू' : '1. General Conditions'}
              </h2>
              <p>
                {isNp
                  ? 'यी नियम र सर्तहरू हाम्रो कर्म प्लेटफर्ममा प्रदान गरिएका सबै सेवाहरूमा लागू हुन्छन्। हामीले कुनै पनि समयमा यी सर्तहरू परिवर्तन गर्ने अधिकार राख्छौं।'
                  : 'These Terms & Conditions apply to all services provided through the Hamro Karma platform. We reserve the right to modify these conditions at any time with prior notice to users.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '२. सेवा प्रदायकको दायित्व' : '2. Service Provider Obligations'}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{isNp ? 'सबै सेवा प्रदायकहरूले पहिचान प्रमाणीकरण पूरा गर्नुपर्छ।' : 'All service providers must complete identity verification.'}</li>
                <li>{isNp ? 'प्रदायकहरूले सहमत समयमा गुणस्तरीय सेवा प्रदान गर्नुपर्छ।' : 'Providers must deliver quality services at the agreed-upon time.'}</li>
                <li>{isNp ? 'प्रदायकहरूले व्यावसायिक र सम्मानजनक ढंगले व्यवहार गर्नुपर्छ।' : 'Providers must behave professionally and respectfully at all times.'}</li>
                <li>{isNp ? 'सेवाको लागि आवश्यक उपकरण र सामग्रीको जिम्मा प्रदायकको हो।' : 'Providers are responsible for their own tools and materials unless agreed otherwise.'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '३. ग्राहकको दायित्व' : '3. Customer Obligations'}
              </h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>{isNp ? 'ग्राहकले आवश्यक कामको सही विवरण दिनुपर्छ।' : 'Customers must provide accurate descriptions of the work required.'}</li>
                <li>{isNp ? 'सहमत मूल्य समयमा भुक्तानी गर्नुपर्छ।' : 'Payment must be made at the agreed price and time.'}</li>
                <li>{isNp ? 'सेवा प्रदायकको लागि सुरक्षित कार्य वातावरण प्रदान गर्नुपर्छ।' : 'A safe working environment must be provided for the service provider.'}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '४. बुकिङ र रद्दीकरण' : '4. Booking & Cancellation'}
              </h2>
              <p>
                {isNp
                  ? 'बुकिंग पुष्टि भएपछि दुवै पक्षले सहमत गर्नुपर्छ। रद्द गर्न कम्तीमा २ घण्टा अगाडि सूचना दिनुपर्छ। बारम्बार रद्दीकरणले कर्म अंकमा असर पार्न सक्छ।'
                  : 'Bookings must be confirmed by both parties. Cancellations require at least 2 hours advance notice. Repeated cancellations may affect your karma score.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '५. विवाद समाधान' : '5. Dispute Resolution'}
              </h2>
              <p>
                {isNp
                  ? 'विवादको अवस्थामा, दुवै पक्षले पहिले प्लेटफर्ममा समाधान खोज्नुपर्छ। हामी मध्यस्थता सेवा प्रदान गर्छौं। समाधान नभएमा, नेपालको कानून लागू हुनेछ।'
                  : 'In case of disputes, both parties should first attempt resolution through the platform. We provide mediation services. Unresolved disputes shall be governed by the laws of Nepal.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '६. गोपनीयता' : '6. Privacy'}
              </h2>
              <p>
                {isNp
                  ? 'हामी तपाईंको व्यक्तिगत डाटाको सुरक्षा गर्छौं। तपाईंको जानकारी तपाईंको सहमति बिना तेस्रो पक्षसँग साझा गरिने छैन। पहिचान कागजात एन्क्रिप्ट गरिएका छन्।'
                  : 'We protect your personal data. Your information will not be shared with third parties without consent. Identity documents are encrypted and stored securely.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '७. हराएको र भेटिएको (FTL)' : '7. Find The Lost (FTL)'}
              </h2>
              <p>
                {isNp
                  ? 'FTL सुविधा सामुदायिक सेवाको रूपमा प्रदान गरिन्छ। हाम्रो कर्मले हराएको सामानको जिम्मेवारी लिँदैन तर मिलान प्रक्रियामा सहयोग गर्छ। झूटो रिपोर्टहरूले खाता निलम्बन गर्न सक्छ।'
                  : 'The FTL feature is provided as a community service. Hamro Karma does not take responsibility for lost items but facilitates the matching process. False reports may result in account suspension.'}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {isNp ? '८. सम्पर्क' : '8. Contact Us'}
              </h2>
              <p>
                {isNp
                  ? 'कुनै प्रश्न वा चिन्ताको लागि, कृपया support@hamrokarma.com मा सम्पर्क गर्नुहोस् वा हाम्रो इन-एप सन्देश प्रणाली प्रयोग गर्नुहोस्।'
                  : 'For any questions or concerns, please contact support@hamrokarma.com or use our in-app messaging system.'}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

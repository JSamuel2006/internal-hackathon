import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, ShieldAlert, Globe, ExternalLink, Volume2, Info, CheckCircle2, AlertCircle, PhoneCall, Bot, Stethoscope, Activity
} from 'lucide-react';
import { I18nService } from '../../i18n';
import { speechService } from '../../services/speechService';

// Localization translations specifically for eSanjeevani Access UI
const localContent: Record<string, {
  title: string;
  subtitle: string;
  buttonLabel: string;
  howItWorksTitle: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  importantTitle: string;
  disclaimer: string;
  emergencyTitle: string;
  emergencyDesc: string;
  offlineTitle: string;
  offlineDesc: string;
  speakPrompt: string;
}> = {
  en: {
    title: "eSanjeevani Telemedicine Access",
    subtitle: "Consult government doctors online through India's National Telemedicine Service (MoHFW, Government of India).",
    buttonLabel: "Consult a Government Doctor",
    howItWorksTitle: "How It Works",
    step1: "Click 'Consult a Government Doctor' to open the official portal.",
    step2: "Register or login using your Mobile Number or ABHA health account details.",
    step3: "Select your State, Specialty, or general OPD consultation queue.",
    step4: "Join the virtual lobby and video-call with a certified government doctor.",
    importantTitle: "Important Information",
    disclaimer: "You will be securely redirected to the official government eSanjeevani platform. ArogyaMitra acts strictly as a safe navigation helper and does NOT store your government credentials, health reports, or appointment logs.",
    emergencyTitle: "Need Immediate or Emergency Medical Help?",
    emergencyDesc: "If you have a life-threatening health emergency, do not wait for online consults. Call government emergency medical services instantly:",
    offlineTitle: "Internet Connectivity Required",
    offlineDesc: "eSanjeevani is a live government portal that requires active internet access. Please check your network connectivity to proceed.",
    speakPrompt: "Click here to listen to these instructions."
  },
  hi: {
    title: "ई-संजीवनी टेलीमेडिसिन सेवा",
    subtitle: "भारत की राष्ट्रीय टेलीमेडिसिन सेवा (स्वास्थ्य एवं परिवार कल्याण मंत्रालय, भारत सरकार) के माध्यम से सरकारी डॉक्टरों से ऑनलाइन परामर्श लें।",
    buttonLabel: "सरकारी डॉक्टर से परामर्श लें",
    howItWorksTitle: "यह कैसे काम करता है",
    step1: "आधिकारिक सरकारी पोर्टल खोलने के लिए 'सरकारी डॉक्टर से परामर्श लें' पर क्लिक करें।",
    step2: "अपने मोबाइल नंबर या आभा (ABHA) स्वास्थ्य खाते की जानकारी का उपयोग करके पंजीकरण या लॉगिन करें।",
    step3: "अपने राज्य, विशेषता, या सामान्य ओपीडी परामर्श कतार का चयन करें।",
    step4: "वर्चुअल लॉबी में शामिल हों और प्रमाणित सरकारी डॉक्टर के साथ वीडियो-कॉल करें।",
    importantTitle: "महत्वपूर्ण सूचना",
    disclaimer: "आपको सुरक्षित रूप से आधिकारिक सरकारी ई-संजीवनी प्लेटफॉर्म पर पुनर्प्रेषित किया जाएगा। आरोग्यमित्र केवल एक सुरक्षित नेविगेशन सहायक के रूप में कार्य करता है और यह आपके सरकारी क्रेडेंशियल्स, स्वास्थ्य रिपोर्ट या अपॉइंटमेंट लॉग को संग्रहीत नहीं करता है।",
    emergencyTitle: "क्या आपको तत्काल या आपातकालीन चिकित्सा सहायता की आवश्यकता है?",
    emergencyDesc: "यदि आपको जीवन-घातक स्वास्थ्य आपात स्थिति है, तो ऑनलाइन परामर्श की प्रतीक्षा न करें। तुरंत सरकारी आपातकालीन चिकित्सा सेवाओं को कॉल करें:",
    offlineTitle: "इंटरनेट कनेक्टिविटी आवश्यक है",
    offlineDesc: "ई-संजीवनी एक लाइव सरकारी पोर्टल है जिसके लिए सक्रिय इंटरनेट पहुंच की आवश्यकता होती है। आगे बढ़ने के लिए कृपया अपनी नेटवर्क कनेक्टिविटी की जांच करें।",
    speakPrompt: "इन निर्देशों को सुनने के लिए यहां क्लिक करें।"
  },
  ta: {
    title: "இ-சஞ்சீவினி (eSanjeevani) இணையவழி மருத்துவம்",
    subtitle: "இந்தியாவின் தேசிய இணையவழி மருத்துவச் சேவையின் (மத்திய சுகாதார அமைச்சகம், இந்திய அரசு) மூலமாக அரசு மருத்துவர்களிடம் இலவசமாக ஆலோசனை பெறுங்கள்.",
    buttonLabel: "அரசு மருத்துவரை அணுகவும்",
    howItWorksTitle: "செயல்படும் முறை",
    step1: "அதிகாரப்பூர்வ அரசு இணையதளத்தைத் திறக்க 'அரசு மருத்துவரை அணுகவும்' பொத்தானை அழுத்தவும்.",
    step2: "உங்கள் கைபேசி எண் அல்லது ABHA மருத்துவக் கணக்கைக் கொண்டு உள்நுழையவும்.",
    step3: "உங்கள் மாநிலம், சிறப்புப் பிரிவு அல்லது பொது OPD பிரிவைத் தேர்ந்தெடுக்கவும்.",
    step4: "காத்திருப்போர் அறையில் இணைந்து, சான்றளிக்கப்பட்ட அரசு மருத்துவருடன் வீடியோ மூலம் ஆலோசனை பெறலாம்.",
    importantTitle: "முக்கிய குறிப்பு",
    disclaimer: "நீங்கள் அதிகாரப்பூர்வ அரசு இ-சஞ்சீவினி தளத்திற்குப் பாதுகாப்பாக வழிநடத்தப்படுவீர்கள். ஆரோக்கியமித்ரா ஒரு வழிகாட்டியாக மட்டுமே செயல்படுகிறது. உங்கள் தனிப்பட்ட அரசு கணக்கு விவரங்கள் அல்லது மருத்துவத் தகவல்களை இது சேமிக்காது.",
    emergencyTitle: "உடனடி அவசர உதவி தேவையா?",
    emergencyDesc: "உயிருக்கு ஆபத்தான மருத்துவ அவசரநிலைகளின் போது, இணையவழி ஆலோசனைக்காகக் காத்திருக்க வேண்டாம். உடனடியாக அவசர உதவி எண்களைத் தொடர்பு கொள்ளவும்:",
    offlineTitle: "இணைய இணைப்பு தேவைப்படுகிறது",
    offlineDesc: "இ-சஞ்சீவினி சேவையைப் பயன்படுத்த உங்களுக்குச் செயலிலுள்ள இணைய இணைப்பு தேவை. உங்கள் இணைப்பைச் சரிபார்த்துவிட்டு மீண்டும் முயற்சிக்கவும்.",
    speakPrompt: "இந்த வழிகாட்டுதல்களைக் கேட்க இங்கே கிளிக் செய்யவும்."
  },
  mr: {
    title: "ई-संजीवनी टेलिमेडिसिन सेवा",
    subtitle: "भारताच्या राष्ट्रीय टेलिमेडिसिन सेवेद्वारे (आरोग्य आणि कुटुंब कल्याण मंत्रालय, भारत सरकार) सरकारी डॉक्टरांचा ऑनलाइन सल्ला घ्या.",
    buttonLabel: "सरकारी डॉक्टरांचा सल्ला घ्या",
    howItWorksTitle: "हे कसे कार्य करते",
    step1: "अधिकृत सरकारी पोर्टल उघडण्यासाठी 'सरकारी डॉक्टरांचा सल्ला घ्या' वर क्लिक करा.",
    step2: "तुमचा मोबाईल नंबर किंवा आभा (ABHA) आरोग्य खात्याचा वापर करून नोंदणी किंवा लॉगिन करा.",
    step3: "तुमचे राज्य, विशेष तज्ज्ञ किंवा सामान्य ओपीडी सल्ला रांग निवडा.",
    step4: "व्हर्च्युअल लॉबीमध्ये सामील व्हा आणि प्रमाणित सरकारी डॉक्टरांशी व्हिडिओ-कॉलद्वारे संवाद साधा.",
    importantTitle: "महत्त्वाची सूचना",
    disclaimer: "तुम्हाला सुरक्षितपणे अधिकृत सरकारी ई-संजीवनी प्लॅटफॉर्मवर निर्देशित केले जाईल. आरोग्यमित्र केवळ एक सुरक्षित मार्गदर्शक म्हणून काम करते आणि तुमचे सरकारी क्रेडेंशियल्स किंवा वैद्यकीय नोंदी साठवत नाही.",
    emergencyTitle: "तात्काळ किंवा आणीबाणी वैद्यकीय मदतीची गरज आहे का?",
    emergencyDesc: "जीवघेण्या वैद्यकीय आणीबाणीच्या वेळी ऑनलाइन सल्ल्याची वाट पाहू नका. त्वरित सरकारी आणीबाणी सेवांशी संपर्क साधा:",
    offlineTitle: "इंटरनेट कनेक्टिव्हिटी आवश्यक",
    offlineDesc: "ई-संजीवनी हे थेट सरकारी पोर्टल आहे ज्यासाठी इंटरनेट कनेक्शन आवश्यक आहे. पुढे जाण्यासाठी कृपया तुमचे नेटवर्क तपासा.",
    speakPrompt: "या सूचना ऐकण्यासाठी येथे क्लिक करा."
  }
};

export default function AppointmentBookingPage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const currentLang = I18nService.getLanguage() || 'en';
  
  // Resolve localized texts, default to English if requested language code doesn't exist
  const content = localContent[currentLang] || localContent['en'];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenESanjeevani = () => {
    if (!isOnline) return;
    
    const officialUrl = 'https://www.esanjeevani.in/';
    
    if ((window as any).Capacitor) {
      window.open(officialUrl, '_system');
    } else {
      window.open(officialUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSpeakInstructions = () => {
    const textToSpeak = `${content.title}. ${content.subtitle}. ${content.howItWorksTitle}. 1. ${content.step1}. 2. ${content.step2}. 3. ${content.step3}. 4. ${content.step4}. ${content.importantTitle}: ${content.disclaimer}`;
    speechService.speak(textToSpeak, currentLang);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto p-4 md:p-8 bg-[#F7FBFC] text-slate-800 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* ── TWO-COLUMN HERO SECTION ──────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Hero Copy & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-extrabold uppercase tracking-wider font-sans">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              OFFICIAL GOVERNMENT TELEMEDICINE
            </span>

            {/* Live Connection Status Badge */}
            {isOnline ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold font-sans">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                Live Connection Verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-bold font-sans">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                Internet Required
              </span>
            )}
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug font-sans">
            {content.title}
          </h1>

          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-sans font-normal">
            {content.subtitle}
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button 
              onClick={handleSpeakInstructions}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-teal-300 text-slate-700 hover:text-teal-700 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer font-sans"
              title="Listen to page instructions"
            >
              <Volume2 className="w-4 h-4 text-teal-600" />
              <span>Listen to Instructions</span>
            </button>
          </div>
        </div>

        {/* Right Column: Clean Gateway Card */}
        <div className="lg:col-span-5 bg-[#EEF7FA] border border-teal-100 rounded-2xl p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider font-sans">
              National Teleconsultation Gateway
            </span>
            <div className="p-2 bg-white rounded-xl text-teal-600 border border-teal-200 shadow-2xs">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            Connect patients directly to certified government physicians and specialists across India via MoHFW.
          </p>

          <div className="space-y-2.5 pt-1 text-xs font-bold text-slate-700 font-sans">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Remote Consultation Pathway</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Real-Time Doctor Video &amp; Chat</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>Accessible Digital Health Records</span>
            </div>
          </div>
        </div>

      </div>

      {/* Offline Alert Banner */}
      {!isOnline && (
        <div className="p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3.5 shadow-2xs font-sans text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-950 uppercase tracking-wider font-sans">{content.offlineTitle}</p>
            <p className="text-amber-900 leading-relaxed font-sans">{content.offlineDesc}</p>
          </div>
        </div>
      )}

      {/* ── MAIN ACTIONS GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Government Telemedicine Portal CTA Card */}
        <div className="md:col-span-6 bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl space-y-6 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700 font-sans block">
              Government Telemedicine Portal
            </span>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans">
              Connect to MoHFW eSanjeevani
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-sans font-normal">
              Ready to connect? eSanjeevani access is integrated seamlessly. Press the button below to transfer securely.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleOpenESanjeevani}
              disabled={!isOnline}
              className={`w-full py-4 px-6 rounded-xl font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer font-sans ${
                isOnline 
                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-teal-500/20' 
                  : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>{content.buttonLabel}</span>
              <ExternalLink className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Side: How It Works List */}
        <div className="md:col-span-6 bg-white border border-slate-200 shadow-sm p-6 md:p-8 rounded-2xl space-y-5">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-sans border-b border-slate-100 pb-3 flex items-center gap-2">
            <span>📋 {content.howItWorksTitle}</span>
          </h2>
          
          <div className="space-y-4 font-sans text-xs text-slate-700">
            <div className="flex items-start gap-3.5">
              <span className="text-teal-600 font-black text-sm font-sans shrink-0 w-6">01</span>
              <span className="leading-relaxed font-sans">{content.step1}</span>
            </div>
            <div className="flex items-start gap-3.5">
              <span className="text-teal-600 font-black text-sm font-sans shrink-0 w-6">02</span>
              <span className="leading-relaxed font-sans">{content.step2}</span>
            </div>
            <div className="flex items-start gap-3.5">
              <span className="text-teal-600 font-black text-sm font-sans shrink-0 w-6">03</span>
              <span className="leading-relaxed font-sans">{content.step3}</span>
            </div>
            <div className="flex items-start gap-3.5">
              <span className="text-teal-600 font-black text-sm font-sans shrink-0 w-6">04</span>
              <span className="leading-relaxed font-sans">{content.step4}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── IMPORTANT INFORMATION ────────────────────────────────────────── */}
      <div className="bg-[#F0F9FA] border border-teal-200/80 shadow-2xs p-6 rounded-2xl space-y-2.5 font-sans">
        <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider font-sans">
          <Info className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{content.importantTitle}</span>
        </h3>
        <p className="text-slate-600 leading-relaxed text-xs font-sans font-normal">
          {content.disclaimer}
        </p>
      </div>

      {/* ── EMERGENCY MEDICAL HELP SECTION ──────────────────────────────── */}
      <div className="p-6 md:p-8 rounded-3xl border border-rose-200 bg-[#FFF5F5] space-y-5 shadow-2xs font-sans">
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-rose-700 flex items-center gap-2.5 font-sans">
            <ShieldAlert className="w-5.5 h-5.5 text-rose-600 shrink-0 animate-pulse" />
            <span>{content.emergencyTitle}</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed font-sans font-normal max-w-2xl">
            {content.emergencyDesc}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 pt-1">
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer font-sans border-none"
          >
            <PhoneCall className="w-4 h-4" />
            <span>📞 CALL 108</span>
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer font-sans border-none"
          >
            <PhoneCall className="w-4 h-4" />
            <span>📞 CALL 112</span>
          </a>
        </div>
      </div>

    </div>
  );
}

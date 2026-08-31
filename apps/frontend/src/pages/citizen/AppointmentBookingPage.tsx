import React, { useState, useEffect } from 'react';
import { 
  HeartPulse, ShieldAlert, Globe, ExternalLink, Volume2, Info, CheckCircle2, AlertCircle, PhoneCall, Bot
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
    howItWorksTitle: "How it Works",
    step1: "Click 'Consult a Government Doctor' to open the official portal.",
    step2: "Register or login using your Mobile Number or ABHA health account details.",
    step3: "Select your State, Specialty, or general OPD consultation queue.",
    step4: "Join the virtual lobby and video-call with a certified government doctor.",
    importantTitle: "Important Notice",
    disclaimer: "You will be securely redirected to the official government eSanjeevani platform. ArogyaMitra acts strictly as a safe navigation helper and does NOT store your government credentials, health reports, or appointment logs.",
    emergencyTitle: "Need Immediate/Emergency Medical Help?",
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
    emergencyTitle: "क्या आपको तत्काल/आपातकालीन चिकित्सा सहायता की आवश्यकता है?",
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
    emergencyTitle: "तात्काळ/आणीबाणी वैद्यकीय मदतीची गरज आहे का?",
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
    
    // Safety Handoff check for Capacitor or web architectures
    // Open using system browser to preserve official CAPTCHA/ABHA auth state.
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
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 text-slate-800">
      
      {/* Title Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <HeartPulse className="w-6.5 h-6.5 text-rose-500 animate-pulse" />
            <span>{content.title}</span>
          </h2>
          <button 
            onClick={handleSpeakInstructions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:text-rose-400 rounded-lg text-slate-600 transition-colors text-[10px] uppercase font-mono font-bold cursor-pointer"
            title="Read out instructions"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>📢 {I18nService.translate('talk_to_ai') || 'Listen'}</span>
          </button>
        </div>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          {content.subtitle}
        </p>
      </div>

      {/* Online/Offline Banner Status */}
      {!isOnline ? (
        <div className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-400 rounded-2xl flex items-start gap-3 shadow-md animate-fade-in font-mono text-xs">
          <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-slate-900 uppercase tracking-wider">{content.offlineTitle}</p>
            <p className="text-slate-600 leading-normal">{content.offlineDesc}</p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 rounded-2xl flex items-center gap-2.5 font-mono text-xs max-w-fit">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span>⚡ Live Connection Verified</span>
        </div>
      )}

      {/* Main Actions layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Call to Action */}
        <div className="md:col-span-6 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
              Government Telemedicine Portal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-mono">
              Ready to connect? eSanjeevani access is integrated seamlessly. Press the button below to transfer securely.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleOpenESanjeevani}
              disabled={!isOnline}
              className={`w-full py-4 px-6 rounded-xl font-bold text-sm uppercase flex items-center justify-center gap-2.5 transition-all shadow-lg select-none cursor-pointer ${
                isOnline 
                  ? 'bg-rose-500 hover:bg-rose-600 text-slate-950 hover:shadow-rose-950/20 scale-[1.01]' 
                  : 'bg-white border border-slate-200 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>{content.buttonLabel}</span>
              <ExternalLink className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Instructions */}
        <div className="md:col-span-6 bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200 space-y-5">
          <h3 className="text-xs font-mono uppercase tracking-wider text-slate-600 font-bold border-b border-slate-200 pb-2">
            📋 {content.howItWorksTitle}
          </h3>
          
          <ul className="space-y-3.5 text-xs text-slate-600 font-mono list-none">
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 font-bold shrink-0">1.</span>
              <span>{content.step1}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 font-bold shrink-0">2.</span>
              <span>{content.step2}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 font-bold shrink-0">3.</span>
              <span>{content.step3}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-rose-500 font-bold shrink-0">4.</span>
              <span>{content.step4}</span>
            </li>
          </ul>
        </div>

      </div>

      {/* Disclaimers & Official info */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 rounded-2xl border border-slate-200/60 bg-white text-xs font-mono space-y-3">
        <h4 className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px]">
          <Info className="w-4 h-4 text-rose-500" />
          <span>{content.importantTitle}</span>
        </h4>
        <p className="text-slate-500 leading-relaxed text-[11px]">
          {content.disclaimer}
        </p>
      </div>

      {/* Emergency Assist Block */}
      <div className="p-6 rounded-2xl border border-red-950/30 bg-red-950/10 space-y-4">
        <div className="space-y-1.5">
          <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <span>{content.emergencyTitle}</span>
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed font-mono">
            {content.emergencyDesc}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 max-w-sm pt-1">
          <a
            href="tel:108"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-900/20 hover:bg-red-900/35 border border-red-500/30 text-rose-300 font-bold rounded-xl text-xs uppercase transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>📞 CALL 108</span>
          </a>
          <a
            href="tel:112"
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-900/20 hover:bg-red-900/35 border border-red-500/30 text-rose-300 font-bold rounded-xl text-xs uppercase transition-all"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>📞 CALL 112</span>
          </a>
        </div>
      </div>

    </div>
  );
}

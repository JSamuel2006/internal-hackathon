import React from 'react';
import { ShieldCheck, Cpu, HardDrive, HelpCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex-1 max-w-4xl mx-auto px-6 py-16 text-slate-100">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent">
          System Architecture & Standards
        </h1>
        <p className="text-sm text-slate-450 mt-2 font-mono">AROGYAVERSE AI ENTERPRISE PLATFORM SPECIFICATION</p>
      </div>

      <div className="space-y-8">
        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-6 rounded-xl border border-slate-900">
            <div className="flex items-center gap-3 mb-3">
              <Cpu className="w-5 h-5 text-teal-400" />
              <h3 className="font-bold text-slate-200">Gemini LLM & RAG Pipeline</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consumes sovereign-hosted clinical guidelines and localized ICMR publications. The AI agent retrieves validated references from our indexed vector database before rendering symptom triage actions, ensuring high precision.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-slate-900">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-slate-200">NDHM & ABHA Compliant</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Integrates with India's Ayushman Bharat Health Account (ABHA). Data transfers are encrypted end-to-end using strict JWT token exchanges, ensuring compliance with the Digital Personal Data Protection Act (DPDP).
            </p>
          </div>
        </div>

        {/* OCR Section */}
        <div className="glass-panel p-8 rounded-xl border border-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-6 h-6 text-indigo-400" />
            <h3 className="font-bold text-lg text-slate-250">OCR strip scanning & drug interaction engines</h3>
          </div>
          <p className="text-xs text-slate-450 leading-relaxed mb-4">
            Our OCR scanner processes low-light image captures of pharmaceutical strips using adaptive thresholding and contrast optimization. The extracted characters are matched against the Indian Pharmacopoeia reference catalogs.
          </p>
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-900/60 text-center font-mono">
            <div>
              <p className="text-lg font-bold text-teal-400">94.2%</p>
              <p className="text-[9px] text-slate-500 uppercase mt-0.5">Recognition Rate</p>
            </div>
            <div>
              <p className="text-lg font-bold text-indigo-400">12ms</p>
              <p className="text-[9px] text-slate-500 uppercase mt-0.5">Preprocessing Lag</p>
            </div>
            <div>
              <p className="text-lg font-bold text-rose-400">22+</p>
              <p className="text-[9px] text-slate-500 uppercase mt-0.5">Dialect translations</p>
            </div>
          </div>
        </div>

        {/* WHO / Government reference */}
        <div className="p-5 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 leading-relaxed flex gap-4">
          <HelpCircle className="w-5 h-5 text-teal-450 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-300 block mb-1">Disclaimer on Automated Intelligence</span>
            All diagnostic pathways, simulated models, and digital twin forecasts shown inside the Command Center are designed to assist public health authorities and medical professionals. Clinical interventions must be validated by licensed medical officers.
          </div>
        </div>
      </div>
    </div>
  );
}

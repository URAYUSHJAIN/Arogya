import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { analyzeReport, validateFile } from '../services/aiService';
import { saveMedicalSummary } from '../services/emergencyService';
import { translations } from '../data/translations';

const AIAnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useOutletContext();
  const t = translations[language].aiAnalysis;

  const [stage, setStage] = useState('upload');
  const [selectedFile, setSelectedFile] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    const uploadedFile = location.state?.uploadedFile;
    if (uploadedFile) {
      const validation = validateFile(uploadedFile);
      if (validation.valid) {
        setSelectedFile(uploadedFile);
        setError(null);
      } else {
        setError(validation.error);
      }
    }
  }, [location.state]);

  const handleFile = (file) => {
    if (!file) return;
    const validation = validateFile(file);
    if (validation.valid) {
      setSelectedFile(file);
      setError(null);
    } else {
      setError(validation.error);
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (event) => {
    handleFile(event.target.files[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setStage('loading');
    setError(null);

    const result = await analyzeReport(selectedFile);
    if (!result.success) {
      setError(result.error);
      setStage('upload');
      return;
    }

    setResults(result.data);
    setStage('results');

    try {
      const medicalSummary = {
        date: new Date().toISOString().split('T')[0],
        summary: result.data.summary || '',
        insights: result.data.insights || '',
        modernMedicine: result.data.modernMedicine || '',
        ayurvedic: result.data.ayurvedic || '',
        lifestyle: result.data.lifestyle || '',
        fullText: result.data.fullText || '',
      };
      saveMedicalSummary(medicalSummary);
    } catch (summaryError) {
      console.warn('Failed to save medical summary for emergency access:', summaryError);
    }
  };

  const rows = useMemo(() => {
    if (!results) return [];
    const sections = [
      { label: 'Summary', value: results.summary || '' },
      { label: 'Insights', value: results.insights || '' },
      { label: 'Modern Medicine', value: results.modernMedicine || '' },
      { label: 'Ayurvedic', value: results.ayurvedic || '' },
      { label: 'Lifestyle', value: results.lifestyle || '' },
    ].filter((item) => item.value.trim().length > 0);

    const inferStatus = (text) => {
      const normalized = text.toLowerCase();
      if (normalized.includes('low') || normalized.includes('deficiency') || normalized.includes('high') || normalized.includes('elevated')) {
        return 'alert';
      }
      return 'normal';
    };

    return sections.map((item) => ({
      ...item,
      status: inferStatus(item.value),
    }));
  }, [results]);

  if (stage === 'upload') {
    return (
      <section className="min-h-screen bg-[#F5F3EE] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#C8DFC9] bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-center text-4xl text-[#1E3A28]">{t.title}</h1>
          <p className="mb-8 text-center text-[#6B8F71]">{t.subtitle}</p>

          <input id="file-input" type="file" accept=".pdf,.jpg,.png" onChange={handleFileSelect} className="hidden" />

          <label
            htmlFor="file-input"
            className={`block cursor-pointer rounded-xl border border-dashed p-8 text-center transition-colors ${
              isDragging
                ? 'border-[#3D6B4F] bg-green-50'
                : 'border-[#A8C5AE] bg-[#F5F3EE] hover:border-[#3D6B4F] hover:bg-green-50'
            }`}
            onDrop={handleDrop}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
          >
            <h2 className="mb-2 text-2xl text-[#1E3A28]">Upload your latest blood report</h2>
            <p className="text-sm text-[#6B8F71]">Drag and drop or browse for a file</p>
          </label>

          {selectedFile && (
            <div className="mt-4 rounded-xl border border-[#C8DFC9] bg-[#F5F3EE] p-4">
              <p className="text-sm text-[#2A4A35]">Selected: {selectedFile.name}</p>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="rounded-xl border border-[#3D6B4F] px-6 py-3 text-[#3D6B4F]"
            >
              {t.backToHome}
            </button>
            <button
              onClick={handleAnalyze}
              disabled={!selectedFile}
              className="rounded-xl bg-[#2A4A35] px-6 py-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t.analyzeReport}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'loading') {
    return (
      <section className="min-h-screen bg-[#F5F3EE] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#C8DFC9] bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-4xl text-[#1E3A28]">Analyzing Your Report</h1>
          <div className="space-y-4">
            <div className="h-16 animate-pulse rounded-xl bg-[#E8F2E9]"></div>
            <div className="h-16 animate-pulse rounded-xl bg-[#E8F2E9]"></div>
            <div className="h-16 animate-pulse rounded-xl bg-[#E8F2E9]"></div>
            <div className="h-16 animate-pulse rounded-xl bg-[#E8F2E9]"></div>
          </div>
        </div>
      </section>
    );
  }

  if (stage === 'results' && results) {
    return (
      <section className="min-h-screen bg-[#F5F3EE] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-[#C8DFC9] bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-center text-4xl text-[#1E3A28]">{t.analysisCompleteTitle}</h1>
          <p className="mb-8 text-center text-[#6B8F71]">{t.analysisCompleteSubtitle}</p>

          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="rounded-xl border border-[#C8DFC9] bg-[#FDFCF9] p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-[#1E3A28]">{row.label}</p>
                  {row.status === 'normal' ? (
                    <span className="rounded-full bg-[#E8F2E9] px-3 py-1 text-xs font-semibold text-[#2A4A35]">Normal</span>
                  ) : (
                    <span className="rounded-full bg-[#FDEFC3] px-3 py-1 text-xs font-semibold text-[#7A5400]">Low / High</span>
                  )}
                </div>
                <p className="text-sm text-[#2A4A35]">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <input
              type="text"
              value={followUp}
              onChange={(event) => setFollowUp(event.target.value)}
              placeholder="Ask a follow-up"
              className="w-full rounded-xl border border-[#C8DFC9] px-4 py-3 focus:border-[#3D6B4F] focus:outline-none"
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate('/emergency')}
              className="rounded-xl bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700"
            >
              {t.emergencyAccess}
            </button>
            <button
              onClick={() => {
                setStage('upload');
                setSelectedFile(null);
                setResults(null);
                setError(null);
              }}
              className="rounded-xl border border-[#3D6B4F] px-6 py-3 text-[#3D6B4F]"
            >
              {t.analyzeAnother}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return null;
};

export default AIAnalysisPage;

import { useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { translations } from '../data/translations';

const Hero = () => {
  const navigate = useNavigate();
  const { language } = useOutletContext();
  const t = translations[language].hero;
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileAndRedirect = (file) => {
    if (!file) return;
    setSelectedFile(file);
    navigate('/ai-analysis', { state: { uploadedFile: file } });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileAndRedirect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    handleFileAndRedirect(file);
  };

  return (
    <section id="home" className="overflow-hidden bg-[#FDFCF9] py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8DFC9] bg-white px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#6B8F71] opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#3D6B4F]"></span>
              </span>
              <span className="text-sm font-medium text-[#2A4A35]">{t.poweredBy}</span>
            </div>

            <h1 className="text-5xl text-[#1E3A28]">
              {t.title}
              <br />
              <span className="text-[#3D6B4F]">{t.subtitle}</span>
            </h1>

            <p className="max-w-xl text-lg text-[#6B8F71]">{t.description}</p>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/ai-analysis"
                className="rounded-lg bg-[#3D6B4F] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2A4A35]"
              >
                {t.getStarted}
              </Link>

              <Link
                to="/emergency"
                className="rounded-lg border border-[#3D6B4F] px-6 py-3 text-sm font-semibold text-[#3D6B4F] transition-colors hover:bg-[#E8F2E9]"
              >
                {t.emergencyHelp}
              </Link>
            </div>

            <div className="flex items-center gap-4 border-t border-[#E8F2E9] pt-6">
              <div className="flex -space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#A8C5AE] text-xs font-semibold text-[#1E3A28]">AL</div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#C8DFC9] text-xs font-semibold text-[#1E3A28]">RK</div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#E8F2E9] text-xs font-semibold text-[#1E3A28]">SM</div>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1E3A28]">Trusted by 10,000+ families</p>
                <p className="text-sm text-[#6B8F71]">Fast AI insights with clinical context</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#E8F2E9]"></div>
            <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#C8DFC9]"></div>

            <div className="relative rounded-2xl border border-[#C8DFC9] bg-white p-6 shadow-lg shadow-[#A8C5AE]/30">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.png"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                className="mb-6 cursor-pointer rounded-xl border border-dashed border-[#A8C5AE] bg-[#F5F3EE] p-6 text-center transition-colors hover:border-[#3D6B4F] hover:bg-green-50"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
              >
                <p className="text-sm font-medium text-[#2A4A35]">Upload your latest blood report</p>
                <p className="mt-2 text-sm text-[#6B8F71]">Drag and drop or browse file</p>
                {selectedFile && (
                  <p className="mt-2 text-xs text-[#3D6B4F]">{selectedFile.name}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-[#E8F2E9] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E3A28]">Hemoglobin</p>
                    <p className="text-sm text-[#2A4A35]">13.2 g/dL</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2A4A35]">Normal</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E3A28]">Vitamin D</p>
                    <p className="text-sm text-[#2A4A35]">18 ng/mL</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">Low</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-[#E8F2E9] px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-[#1E3A28]">Blood Sugar (Fasting)</p>
                    <p className="text-sm text-[#2A4A35]">91 mg/dL</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2A4A35]">Normal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

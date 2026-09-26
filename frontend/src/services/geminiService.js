import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const HF_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN;
const MODEL_ID = "meta-llama/Llama-3.2-11B-Vision-Instruct";

// File validation helpers
export const validateFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please upload JPG, PNG, or PDF files.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 10MB. Please upload a smaller file.',
    };
  }

  return { valid: true, error: null };
};

// Convert file to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Convert PDF to images (returns array of base64 strings)
const convertPdfToImages = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];

  // Limit to first 3 pages to avoid payload limits
  const pageCount = Math.min(pdf.numPages, 3);

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    images.push(canvas.toDataURL('image/jpeg').split(',')[1]);
  }

  return images;
};

// Parse AI response into structured sections
const parseResponse = (text) => {
  const sections = {
    summary: '',
    insights: '',
    modernMedicine: '',
    ayurvedic: '',
    lifestyle: '',
    fullText: text,
  };

  if (!text || text.trim().length === 0) {
    sections.summary = 'No response received from AI. Please try again.';
    return sections;
  }

  try {
    // Clean up markdown code blocks
    let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Extract JSON object
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    const data = JSON.parse(cleanText);
    
    return {
        summary: data.summary || '',
        insights: data.insights || '',
        modernMedicine: data.modernMedicine || '',
        ayurvedic: data.ayurvedic || '',
        lifestyle: data.lifestyle || '',
        fullText: text
    };
  } catch (e) {
    console.warn("JSON parse failed, using fallback extraction", e);
    // Fallback: Return full text as summary if parsing fails
    sections.summary = text;
    return sections;
  }
};

// Main function: Analyze medical report
export const analyzeReport = async (file) => {
  try {
    if (!HF_TOKEN || HF_TOKEN === 'your_hugging_face_token_here') {
      return {
        success: false,
        error: 'Hugging Face Token is not configured. Please add VITE_HUGGING_FACE_TOKEN to your .env.local file.',
      };
    }

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Prepare images
    let images = [];
    if (file.type === 'application/pdf') {
      images = await convertPdfToImages(file);
    } else {
      const base64 = await fileToBase64(file);
      images = [base64];
    }

    // Construct the prompt
    const prompt = `You are an AI medical assistant. Analyze this medical report image.
    
    Extract all text and provide a comprehensive health analysis in the following JSON format:
    {
      "summary": "Brief overview of key findings",
      "insights": "Detailed explanation of medical terms and results",
      "modernMedicine": "Medical advice and follow-up actions",
      "ayurvedic": "Ayurvedic suggestions and herbal remedies",
      "lifestyle": "Diet and lifestyle recommendations"
    }
    
    Return ONLY valid JSON. Do not include any other text.`;

    // Prepare payload for Hugging Face Inference API
    // Llama 3.2 Vision expects a specific format or we can use the standard image-text-to-text task format
    // For the Inference API, we often send inputs directly.
    // However, for Vision models, the payload structure can vary.
    // We will use the standard chat completion format if supported, or the raw input format.
    
    // Using the chat completion endpoint for vision models if available, or standard inference
    // Llama 3.2 Vision is a multimodal model.
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL_ID}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        "x-use-cache": "false"
      },
      body: JSON.stringify({
        inputs: `<|image|>\n${prompt}`,
        parameters: {
          max_new_tokens: 2000,
          temperature: 0.1, // Low temperature for consistent JSON
        },
        // For some HF models, image is passed separately or encoded in inputs
        // Standard HF Inference API for vision-text-to-text usually accepts:
        // { inputs: "text", image: "base64" } or similar.
        // But Llama 3.2 Vision might be deployed as a chat model.
        // Let's try the standard payload for multimodal models on HF Inference API.
        // If this fails, we might need to adjust the payload structure.
        image: images[0] // Sending the first page/image for analysis
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 503) {
        throw new Error("Model is loading. Please try again in a few seconds.");
      }
      throw new Error(errorData.error || `API Error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Result format depends on the model task. 
    // Usually it's an array of generated text: [{ generated_text: "..." }]
    let generatedText = "";
    if (Array.isArray(result) && result[0]?.generated_text) {
      generatedText = result[0].generated_text;
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else {
      generatedText = JSON.stringify(result);
    }

    // Clean up the response (remove the prompt if it's echoed back)
    generatedText = generatedText.replace(prompt, '').replace('<|image|>', '').trim();

    const parsedSections = parseResponse(generatedText);

    return {
      success: true,
      data: parsedSections,
    };

  } catch (error) {
    console.error("Analysis Error:", error);
    return {
      success: false,
      error: error.message || 'Failed to analyze report.',
    };
  }
};

import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const HF_TOKEN = import.meta.env.VITE_HUGGING_FACE_TOKEN;
const MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct";

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

// Helper to resize image to avoid payload limits
const resizeImage = (base64Str) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64Str}`;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
  });
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

    // Resize the first image to ensure it fits in the payload
    const resizedImageBase64 = await resizeImage(images[0]);

    // Construct the prompt
    const userPrompt = `Analyze this medical report image.
    
    Extract all text and provide a comprehensive health analysis in the following JSON format:
    {
      "summary": "Brief overview of key findings",
      "insights": "Detailed explanation of medical terms and results",
      "modernMedicine": "Medical advice and follow-up actions",
      "ayurvedic": "Ayurvedic suggestions and herbal remedies",
      "lifestyle": "Diet and lifestyle recommendations"
    }
    
    Return ONLY valid JSON. Do not include any other text.`;

    // Prepare payload for Hugging Face Router via Hyperbolic provider
    // Using Qwen2.5-VL-7B-Instruct with OpenAI-compatible chat completions endpoint
    
    // Use proxy in development to avoid CORS, direct URL in production
    const API_URL = import.meta.env.DEV 
      ? `/api/hf/hyperbolic/v1/chat/completions`
      : `https://router.huggingface.co/hyperbolic/v1/chat/completions`;

    console.log("Calling AI API at:", API_URL);

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL_ID,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${resizedImageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error) errorMessage = errorJson.error;
      } catch {
        // If not JSON, use the text or status
        if (errorText.includes("<!DOCTYPE html>")) {
          errorMessage = "Proxy Error: The server returned an HTML page instead of JSON. Please check your network connection or proxy settings.";
        } else if (errorText.length < 100) {
          errorMessage += ` - ${errorText}`;
        }
      }
      
      if (response.status === 503) {
        throw new Error("Model is loading. Please try again in a few seconds.");
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    // Result format is OpenAI-compatible chat completions
    let generatedText = "";
    if (result.choices && result.choices.length > 0) {
      generatedText = result.choices[0].message?.content || "";
    } else if (Array.isArray(result) && result[0]?.generated_text) {
      generatedText = result[0].generated_text;
    } else if (result.generated_text) {
      generatedText = result.generated_text;
    } else {
      generatedText = JSON.stringify(result);
    }

    // Clean up the response
    generatedText = generatedText.trim();

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

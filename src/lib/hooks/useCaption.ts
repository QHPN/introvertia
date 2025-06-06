import { useState } from "react";

export function useCaption() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCaption = async (imageFile: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      
      const response = await fetch("/api/ai/caption", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Không thể tạo chú thích");
      }
      
      const data = await response.json();
      return data.caption;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định");
      return "";
    } finally {
      setLoading(false);
    }
  };
  
  return { generateCaption, loading, error };
} 
"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: number;
  filename: string;
  extracted_text: string;
  created_at: string;
};

export default function Home() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const [file, setFile] = useState<File | null>(null);
  const [filename, setFilename] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadHistory = async () => {
    if (!apiUrl) {
      setMessage("API URL is not configured.");
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/history`);
      const data = await res.json();
      setHistory(data.items || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load history.");
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleExtract = async () => {
    if (!apiUrl) {
      setMessage("API URL is not configured.");
      return;
    }

    if (!file) {
      setMessage("Please choose an image first.");
      return;
    }

    setLoading(true);
    setMessage("");
    setExtractedText("");
    setFilename("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiUrl}/extract`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "OCR failed.");
      }

      setFilename(data.filename || file.name);
      setExtractedText(data.message || "");
      setMessage("OCR completed successfully.");
    } catch (error: any) {
      setMessage(error.message || "OCR failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiUrl) {
      setMessage("API URL is not configured.");
      return;
    }

    if (!filename || !extractedText) {
      setMessage("No OCR result to save.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`${apiUrl}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename,
          extracted_text: extractedText,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Save failed.");
      }

      setMessage("OCR result saved successfully.");
      await loadHistory();
    } catch (error: any) {
      setMessage(error.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-8 text-4xl font-bold text-slate-900">
          HD OCR Full-Stack App
        </h1>

        <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
          <h2 className="mb-5 text-2xl font-semibold text-slate-800">
            Upload Image for OCR
          </h2>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mb-5 block w-full text-base text-slate-800 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-300"
          />

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleExtract}
              disabled={loading}
              className="rounded-xl bg-black px-6 py-3 text-base font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Extracting..." : "Run OCR"}
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !extractedText}
              className="rounded-xl bg-blue-600 px-6 py-3 text-base font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Result"}
            </button>
          </div>

          {message && (
            <p className="mt-5 text-base font-medium text-slate-700">{message}</p>
          )}
        </div>

        <div className="mb-8 rounded-2xl bg-white p-8 shadow-md">
          <h2 className="mb-5 text-2xl font-semibold text-slate-800">
            OCR Result
          </h2>

          <p className="mb-3 text-lg text-slate-700">
            <span className="font-semibold">Filename:</span> {filename || "-"}
          </p>

          <textarea
            value={extractedText}
            readOnly
            className="min-h-[260px] w-full rounded-xl border border-slate-300 bg-white p-4 text-base text-slate-900 outline-none"
          />
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-md">
          <h2 className="mb-5 text-2xl font-semibold text-slate-800">
            Saved OCR History
          </h2>

          {history.length === 0 ? (
            <p className="text-base text-slate-600">No records yet.</p>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-lg font-semibold text-slate-900">
                    {item.filename}
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-base text-slate-700">
                    {item.extracted_text}
                  </p>

                  <p className="mt-3 text-sm text-slate-500">
                    {item.created_at}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
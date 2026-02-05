import React, { useState, useEffect } from "react";
import { FaShieldAlt, FaFileContract, FaCheck } from "react-icons/fa";

interface IntroPageProps {
  onAgree: () => void;
  theme: "light" | "dark";
  readOnly?: boolean;
}

export const IntroPage: React.FC<IntroPageProps> = ({
  onAgree,
  theme,
  readOnly = false,
}) => {
  const [privacyPolicy, setPrivacyPolicy] = useState<string>("");
  const [termsConditions, setTermsConditions] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(readOnly);
  const [activeDoc, setActiveDoc] = useState<"privacy" | "terms">("privacy");

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const [ppRes, tcRes] = await Promise.all([
          fetch("/docs/legal/privacy-policy.html"),
          fetch("/docs/legal/terms-conditions.html"),
        ]);
        const [ppHtml, tcHtml] = await Promise.all([
          ppRes.text(),
          tcRes.text(),
        ]);

        // Extract body content from HTML, or return full HTML if no body tag
        const extractBody = (html: string) => {
          const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
          if (bodyMatch) return bodyMatch[1];

          // If no body, strip doctype/html/head but keep everything else
          return html
            .replace(/<!DOCTYPE[^>]*>/i, "")
            .replace(/<html[^>]*>/i, "")
            .replace(/<\/html>/i, "")
            .replace(/<head[\s\S]*?<\/head>/i, "")
            .trim();
        };

        setPrivacyPolicy(extractBody(ppHtml));
        setTermsConditions(extractBody(tcHtml));
      } catch (error) {
        console.error("Failed to load legal documents:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  const logoSrc = theme === "dark" ? "/nsf-dark.svg" : "/nsf-light.svg";

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500 max-w-4xl mx-auto w-full px-4 ${readOnly ? "" : "h-full"}`}
    >
      {!readOnly && (
        <div className="text-center space-y-2">
          <img
            src={logoSrc}
            alt="NS-Forge Logo"
            className="h-16 mx-auto mb-2"
          />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-base-content/60 text-sm">
            Please review our legal documents before we get started.
          </p>
        </div>
      )}

      <div className="w-full space-y-0">
        <div className="flex justify-center -mb-px">
          <button
            onClick={() => setActiveDoc("privacy")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
              activeDoc === "privacy"
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-base-content/40 hover:text-base-content/60 hover:bg-base-200/50"
            } rounded-t-xl`}
          >
            <FaShieldAlt
              className={activeDoc === "privacy" ? "animate-pulse" : ""}
            />
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveDoc("terms")}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-200 border-b-2 ${
              activeDoc === "terms"
                ? "border-secondary text-secondary bg-secondary/5"
                : "border-transparent text-base-content/40 hover:text-base-content/60 hover:bg-base-200/50"
            } rounded-t-xl`}
          >
            <FaFileContract
              className={activeDoc === "terms" ? "animate-pulse" : ""}
            />
            Terms & Conditions
          </button>
        </div>

        <div className="bg-base-100 border border-base-200 rounded-xl rounded-t-none p-5 h-[320px] overflow-auto shadow-inner prose prose-sm max-w-none dark:prose-invert relative legal-doc-container">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-2">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/40 animate-pulse">
                Loading documents...
              </p>
            </div>
          ) : (
            <div
              key={activeDoc}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 doc-content"
              dangerouslySetInnerHTML={{
                __html:
                  activeDoc === "privacy" ? privacyPolicy : termsConditions,
              }}
            />
          )}
        </div>
      </div>

      <style>{`
        .legal-doc-container .doc-content h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 1rem;
          color: currentColor;
          border-bottom: 2px solid var(--fallback-p,oklch(var(--p)));
          display: inline-block;
        }
        .legal-doc-container .doc-content h2 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: currentColor;
          display: flex;
          align-items: center;
        }
        .legal-doc-container .doc-content h2::before {
          content: "";
          display: inline-block;
          width: 3px;
          height: 16px;
          background-color: var(--fallback-p,oklch(var(--p)));
          margin-right: 8px;
          border-radius: 2px;
        }
        .legal-doc-container .doc-content .last-updated {
          font-style: italic;
          opacity: 0.6;
          font-size: 0.8rem;
          margin-bottom: 1.5rem;
        }
        .legal-doc-container .doc-content .highlight {
          background-color: color-mix(in srgb, var(--fallback-p,oklch(var(--p))), transparent 90%);
          border-left: 4px solid var(--fallback-p,oklch(var(--p)));
          padding: 1rem;
          margin: 1rem 0;
          border-radius: 0 8px 8px 0;
        }
        .legal-doc-container .doc-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
        }
        .legal-doc-container .doc-content footer {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid color-mix(in srgb, currentColor, transparent 90%);
          text-align: center;
          font-size: 0.75rem;
          opacity: 0.5;
        }
      `}</style>

      <div className="flex flex-col items-center space-y-4 pt-2 w-full">
        {readOnly ? (
          <div className="flex items-center gap-2 text-success font-medium bg-success/10 px-4 py-2 rounded-full text-sm">
            <FaCheck />
            <span>You have agreed to these legal documents.</span>
          </div>
        ) : (
          <>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-sm"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="text-sm text-base-content/70 group-hover:text-base-content transition-colors">
                I have read and agree to the Privacy Policy and Terms &
                Conditions.
              </span>
            </label>

            <button
              className={`btn btn-primary btn-md gap-2 px-10 transition-all duration-300 ${
                !agreed ? "btn-disabled opacity-50" : "hover:scale-105"
              }`}
              onClick={onAgree}
              disabled={!agreed}
            >
              <FaCheck /> Accept & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
};

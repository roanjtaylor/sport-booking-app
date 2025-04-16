// src/components/onboarding/OnboardingTimeline.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type OnboardingStep = {
  title: string;
  description: string;
  imageType: "browse" | "book" | "play" | "start";
};

type OnboardingTimelineProps = {
  steps: OnboardingStep[];
};

export function OnboardingTimeline({ steps }: OnboardingTimelineProps) {
  const [activeStep, setActiveStep] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Scroll to the active step
  useEffect(() => {
    if (timelineRef.current) {
      const stepWidth = timelineRef.current.scrollWidth / steps.length;
      timelineRef.current.scrollTo({
        left: activeStep * stepWidth,
        behavior: "smooth",
      });
    }
  }, [activeStep, steps.length]);

  // Go to next step
  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  // Go to previous step
  const goToPrevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="w-full relative">
      {/* Timeline scroll area */}
      <div
        ref={timelineRef}
        className="overflow-x-hidden hide-scrollbar snap-x snap-mandatory w-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div className="flex">
          {steps.map((step, index) => (
            <div
              key={index}
              className="min-w-full w-full flex-shrink-0 snap-center px-4"
            >
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-gray-100 w-64 h-48 rounded-lg mb-6 flex items-center justify-center overflow-hidden">
                  <OnboardingImage type={step.imageType} />
                </div>
                <h3 className="text-4xl sm:text-5xl font-bold mb-6">
                  {step.title}
                </h3>
                <p className="text-gray-600 max-w-md mb-8 text-xl">
                  {step.description}
                </p>

                {/* Show action buttons only on the last step */}
                {index === steps.length - 1 && (
                  <div className="flex flex-col space-y-3 w-full max-w-xs">
                    <Link href="/discover" className="w-full">
                      <Button size="lg" fullWidth>
                        Browse Facilities
                      </Button>
                    </Link>
                    <Link href="/auth/login" className="w-full">
                      <Button variant="outline" size="lg" fullWidth>
                        Log In
                      </Button>
                    </Link>
                    <Link href="/auth/register" className="w-full">
                      <Button variant="secondary" size="lg" fullWidth>
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Large circular arrow buttons positioned on sides */}
      <button
        onClick={goToPrevStep}
        disabled={activeStep === 0}
        className={`absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white shadow-lg flex items-center justify-center transition-opacity ${
          activeStep === 0
            ? "opacity-0 cursor-default"
            : "opacity-75 hover:opacity-100"
        }`}
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        onClick={goToNextStep}
        disabled={activeStep === steps.length - 1}
        className={`absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white shadow-lg flex items-center justify-center transition-opacity ${
          activeStep === steps.length - 1
            ? "opacity-0 cursor-default"
            : "opacity-75 hover:opacity-100"
        }`}
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {/* Progress indicators */}
      <div className="flex justify-center space-x-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === activeStep ? "bg-primary-600" : "bg-gray-300"
            }`}
            onClick={() => setActiveStep(index)}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      {/* Add some CSS to hide scrollbars but keep functionality */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Simple component for onboarding illustrations
function OnboardingImage({ type }: { type: string }) {
  const colors = {
    browse: { bg: "#dbeafe", accent: "#3b82f6" },
    book: { bg: "#fef3c7", accent: "#f59e0b" },
    play: { bg: "#dcfce7", accent: "#10b981" },
    start: { bg: "#f3e8ff", accent: "#8b5cf6" },
  };

  const color = colors[type as keyof typeof colors] || colors.browse;

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ backgroundColor: color.bg }}
    >
      {type === "browse" && (
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="20" y="20" width="60" height="60" rx="5" fill="white" />
          <rect
            x="30"
            y="35"
            width="40"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <rect
            x="30"
            y="45"
            width="30"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <rect
            x="30"
            y="55"
            width="20"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <circle cx="65" cy="30" r="5" fill={color.accent} />
        </svg>
      )}

      {type === "book" && (
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="25" y="20" width="50" height="60" rx="5" fill="white" />
          <rect
            x="35"
            y="30"
            width="30"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <rect
            x="35"
            y="40"
            width="30"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <rect
            x="35"
            y="50"
            width="30"
            height="5"
            rx="2"
            fill={color.accent}
          />
          <rect
            x="35"
            y="65"
            width="30"
            height="10"
            rx="5"
            fill={color.accent}
          />
        </svg>
      )}

      {type === "play" && (
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="30" fill="white" />
          <path d="M45 35L65 50L45 65V35Z" fill={color.accent} />
        </svg>
      )}

      {type === "start" && (
        <svg
          width="100"
          height="100"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="50" cy="50" r="30" fill="white" />
          <path
            d="M40 50H60M50 40V60"
            stroke={color.accent}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}

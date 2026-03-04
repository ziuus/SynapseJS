"use client";

// src/useAgentDOM.ts
import { useEffect, useState } from "react";
function useAgentDOM() {
  const [domElements, setDomElements] = useState([]);
  useEffect(() => {
    const scanDOM = () => {
      const interactables = document.querySelectorAll('button, input, a, [role="button"], [data-axon-read="true"]');
      const elements = [];
      interactables.forEach((el) => {
        if (!el.id) {
          el.id = "axon-" + Math.random().toString(36).substr(2, 9);
        }
        const tagName = el.tagName.toLowerCase();
        let type = "unknown";
        if (tagName === "button" || el.getAttribute("role") === "button") type = "button";
        if (tagName === "input") type = "input";
        if (tagName === "a") type = "link";
        elements.push({
          id: el.id,
          type,
          text: el.innerText?.trim() || el.getAttribute("aria-label") || void 0,
          placeholder: el.placeholder || void 0,
          actionable: !el.disabled
        });
      });
      setDomElements(elements);
    };
    scanDOM();
    window.addEventListener("click", scanDOM);
    window.addEventListener("keyup", scanDOM);
    return () => {
      window.removeEventListener("click", scanDOM);
      window.removeEventListener("keyup", scanDOM);
    };
  }, []);
  return domElements;
}
export {
  useAgentDOM
};

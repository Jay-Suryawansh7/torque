import { useEffect, useCallback } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const TOUR_SEEN_KEY = "torque_tour_seen_v1";

const STEPS = [
  {
    element: "#tour-toolbar",
    popover: {
      title: "Welcome to Torque 👋",
      description: "Torque lets you build AI agent workflows visually. Drag nodes from the sidebar, connect them, and run your automation.",
      side: "bottom" as const, align: "start" as const,
    },
  },
  {
    element: "#tour-palette",
    popover: {
      title: "Node Palette",
      description: "Browse 19+ node types: Triggers, Flow logic, AI Agents, LLM calls, Data connectors, and Outputs. Click any node to add it to the canvas.",
      side: "right" as const, align: "start" as const,
    },
  },
  {
    element: "#tour-canvas",
    popover: {
      title: "The Canvas",
      description: "This is your workspace. Drag nodes around, connect them by dragging between handles, and build your workflow visually.",
      side: "top" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-toolbar",
    popover: {
      title: "Toolbar",
      description: "Save workflows, export as TypeScript code (uses the real <code>deepagents</code> npm package), or hit <strong>Run</strong> to execute.",
      side: "bottom" as const, align: "end" as const,
    },
  },
  {
    element: "#tour-run",
    popover: {
      title: "Run Your Workflow",
      description: "Click Run to execute the workflow. Watch real-time logs stream in the bottom panel as each node executes.",
      side: "bottom" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-logs",
    popover: {
      title: "Execution Logs",
      description: "Every run produces timestamped logs with node-level detail. See what happened, step by step.",
      side: "top" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-providers",
    popover: {
      title: "LLM Providers",
      description: "Connect API keys for OpenAI, Anthropic, Google AI, Groq, and more. Keys stay on your machine.",
      side: "right" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-connectors",
    popover: {
      title: "App Connectors",
      description: "Integrate with 18+ services: Google Docs, Slack, Notion, GitHub, Jira, Stripe, and more.",
      side: "right" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-mcp",
    popover: {
      title: "MCP Servers",
      description: "Connect MCP servers to give your agents access to external tools and data sources.",
      side: "right" as const, align: "center" as const,
    },
  },
  {
    element: "#tour-canvas",
    popover: {
      title: "Ready to Build? 🚀",
      description: "Add a Trigger node from the palette, connect it to an Agent or LLM, then an Output. Press <strong>Run</strong> to see it in action!",
      side: "top" as const, align: "center" as const,
    },
  },
];

export function useOnboardingTour() {
  useEffect(() => {
    const force = new URLSearchParams(window.location.search).has("tour");
    const seen = localStorage.getItem(TOUR_SEEN_KEY);
    if (seen && !force) return;

    const tour = driver({
      animate: true,
      showProgress: true,
      showButtons: ["next", "previous", "close"],
      steps: STEPS,
    });

    const timer = setTimeout(() => {
      tour.drive();
      localStorage.setItem(TOUR_SEEN_KEY, "true");
    }, 700);

    return () => {
      clearTimeout(timer);
      try { if (tour.isActive()) tour.destroy(); } catch (err) { console.error("Tour cleanup:", err); }
    };
  }, []);
}

export function restartTour() {
  localStorage.removeItem(TOUR_SEEN_KEY);
  window.location.href = window.location.pathname + "?tour=true";
}

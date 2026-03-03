export interface TutorialStep {
    targetId: string | null; // null = no spotlight, full overlay
    title: string;
    description: string;
    route: string; // which route this step should be rendered on
    shape?: "circle" | "rect"; // default "rect"
}

export const tutorialSteps: TutorialStep[] = [
    {
        targetId: null,
        route: "/",
        title: "Welcome! 👋",
        description:
            "Let's walk you through setting up your invoicing app. We'll visit each section so you know where everything is.",
    },
    {
        targetId: "settings-business-card",
        route: "/settings",
        shape: "rect",
        title: "Step 1: Business Details",
        description:
            "This is where you enter your business name, GSTIN, address, and bank details. These will appear on every invoice you create.",
    },
    {
        targetId: "customers-add-btn",
        route: "/customers",
        shape: "circle",
        title: "Step 2: Add Customers",
        description:
            "Tap the \"+ Add\" button to save your clients. Having customers saved lets you quickly select them when creating invoices.",
    },
    {
        targetId: "nav-new-invoice",
        route: "/",
        shape: "circle",
        title: "Step 3: Create an Invoice",
        description:
            "Tap \"+ New\" to create your first GST-compliant invoice. Pick a customer, add line items, set GST rates, and generate a PDF.",
    },
    {
        targetId: "stats-section",
        route: "/",
        shape: "rect",
        title: "Track Your Business",
        description:
            "Your dashboard shows total invoices, outstanding payments, amount collected, and overdue count — all updated in real time.",
    },
    {
        targetId: "invoice-search",
        route: "/",
        shape: "rect",
        title: "Find & Filter Invoices",
        description:
            "Use the search bar to find invoices by client name or number. The status tabs below let you filter by Draft, Sent, Paid, or Overdue.",
    },
    {
        targetId: null,
        route: "/",
        title: "You're All Set! 🎉",
        description:
            "Start by saving your business details in Settings, then create your first invoice. Restart this guide anytime with the (?) button.",
    },
];

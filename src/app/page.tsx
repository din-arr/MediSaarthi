
import Link from "next/link";

const features = [
  {
    icon: "💊",
    title: "Medicine Management",
    description:
      "Keep track of your medicines, dosages, and daily schedules in one organized place.",
  },
  {
    icon: "📋",
    title: "Digital Prescriptions",
    description:
      "Store your prescriptions securely and access them whenever you need.",
  },
  {
    icon: "⏰",
    title: "Smart Reminders",
    description:
      "Stay consistent with your medication routine using personalized reminders.",
  },
  {
    icon: "✨",
    title: "AI Health Assistant",
    description:
      "Understand prescription details and medicine information in simpler language.",
  },
  {
    icon: "🌐",
    title: "Hindi & English",
    description:
      "Access important healthcare information in the language you prefer.",
  },
  {
    icon: "📊",
    title: "Health Dashboard",
    description:
      "View medicine schedules, prescription history, and daily progress.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fbfa] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-emerald-700">
            Medi<span className="text-slate-900">Saarthi</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-emerald-700">Features</a>
            <a href="#how-it-works" className="hover:text-emerald-700">How It Works</a>
            <a href="#about" className="hover:text-emerald-700">About</a>
          </div>

          <a
            href="#features"
            className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Explore Features
          </a>
        </nav>
      </header>

      <section className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute -right-24 top-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
            Your Digital Healthcare Companion
          </span>

          <h1 className="mx-auto mt-8 max-w-4xl text-5xl font-extrabold leading-tight tracking-tight md:text-7xl">
            Your Health.
            <br />
            <span className="text-emerald-600">Our Priority.</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600">
            Managing your health should be simple. MediSaarthi
            brings medicine tracking, digital prescriptions,
            reminders, and AI-powered assistance together
            in one easy-to-use platform.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a
              href="#features"
              className="rounded-xl bg-emerald-600 px-8 py-4 font-semibold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
            >
              Explore MediSaarthi
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              How It Works
            </a>
          </div>

          <div className="mt-14 flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
            <span>✓ Easy to Use</span>
            <span>✓ Made for India</span>
            <span>✓ Hindi & English Planned</span>
          </div>
        </div>
      </section>

      <section id="features" className="bg-white px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="font-semibold text-emerald-600">
              OUR FEATURES
            </span>
            <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
              Everything You Need,
              <br />
              In One Place.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-slate-500">
              Tools designed to make everyday healthcare
              management easier and more organized.
            </p>
          </div>

          <div className="mt-16 grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-3xl border border-slate-100 bg-[#f8fbfa] p-8 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-3xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-4 leading-7 text-slate-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <span className="font-semibold text-emerald-600">
            SIMPLE & EASY
          </span>
          <h2 className="mt-4 text-4xl font-bold">
            How MediSaarthi Works
          </h2>

          <div className="mt-16 grid gap-10 md:grid-cols-3">
            {[
              ["01", "Create Your Profile", "Set up your personal healthcare workspace."],
              ["02", "Add Your Medicines", "Organize prescriptions and medicine schedules."],
              ["03", "Stay on Track", "Follow your routine and review your progress."],
            ].map(([number, title, description]) => (
              <div key={number} className="rounded-3xl bg-white p-9 shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl font-bold text-emerald-700">
                  {number}
                </div>
                <h3 className="mt-7 text-xl font-bold">{title}</h3>
                <p className="mt-4 leading-7 text-slate-500">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="bg-emerald-700 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold md:text-4xl">
          Better Healthcare Starts With Better Organization.
        </h2>
        <p className="mx-auto mt-6 max-w-2xl leading-8 text-emerald-50">
          Built with the goal of making everyday medicine
          management simpler and more accessible for people in India.
        </p>
        <a
          href="#features"
          className="mt-9 inline-block rounded-xl bg-white px-8 py-4 font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          Discover Our Features
        </a>
      </section>

      <footer className="border-t border-slate-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 md:flex-row">
          <span className="text-xl font-bold text-emerald-700">
            MediSaarthi
          </span>
          <p className="text-center text-sm text-slate-500">
            © 2026 MediSaarthi. Built for better healthcare.
          </p>
          <p className="text-xs text-slate-400">
            Educational project. Not a substitute for medical advice.
          </p>
        </div>
      </footer>
    </main>
  );
}

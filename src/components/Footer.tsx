export default function Footer() {
  return (
    <footer className="border-t border-black/5 mt-24">
      <div className="container-page py-10 text-sm text-ink-500 flex flex-col sm:flex-row justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} Excel Mastery. From Basics to Business-Ready Excel.</p>
        <p>Payments processed securely via Razorpay.</p>
      </div>
    </footer>
  );
}
